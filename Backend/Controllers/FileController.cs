using System.IO.Compression;
using System.Security.Claims;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMAS_CITI.Enums;
using PMAS_CITI.Models;
using PMAS_CITI.RequestBodies;
using PMAS_CITI.RequestBodies.Documents;
using PMAS_CITI.ResponseObjects;
using PMAS_CITI.Services;
using Quartz;

namespace PMAS_CITI.Controllers;

[Route("api/projects/documents")]
[ApiController]
[EnableCors("APIPolicy")]
public class FileController : ControllerBase
{
    private PMASCITIDbContext _context { get; set; }
    private IWebHostEnvironment _environment { get; set; }
    private ProjectService _projectService { get; set; }
    private FileService _fileService { get; set; }
    private UserService _userService { get; set; }

    public FileController(
        PMASCITIDbContext context,
        IWebHostEnvironment environment,
        ProjectService projectService,
        FileService fileService,
        UserService userService)
    {
        _context = context;
        _environment = environment;
        _projectService = projectService;
        _fileService = fileService;
        _userService = userService;
    }

    /// <summary>
    /// Saves files uploaded by the user to the following folder directory pattern
    /// "/approot/ProjectDocuments/{ProjectId}/{DocumentTypeId}/{FileName}"
    /// </summary>
    /// 
    /// <param name="payload">
    /// The ProjectId, DocumentTypeId and the files that are supposed to be saved.
    /// </param>
    /// 
    /// <returns>Status Code indicating whether the files have been successfully saved</returns>
    [HttpPost]
    public async Task<IActionResult> AddDocumentsToProject([FromForm] AddDocumentsToProjectForm payload)
    {
        // Checking if project and type exists
        Project? targetedProject = _projectService.GetProjectById(payload.ProjectId);

        if (targetedProject == null)
        {
            return NotFound($"Project with Id {payload.ProjectId} does not exist.");
        }

        ProjectDocumentType? targetedDocumentType = _fileService.GetDocumentTypeById(payload.DocumentTypeId);

        if (targetedDocumentType == null)
        {
            return NotFound($"Document type with Id {payload.DocumentTypeId} does not exist.");
        }

        // Reading the JWT token sent with the request to get the user.
        ClaimsIdentity? currentIdentity = HttpContext.User.Identity as ClaimsIdentity;
        string userId = currentIdentity.FindFirst("user_id").Value;

        User? currentUser = _userService.GetUserById(userId);

        if (currentUser == null)
        {
            return Unauthorized();
        }

        string projectDocumentsDirectory =
            $"{_environment.ContentRootPath}/approot/ProjectDocuments/{targetedProject.Id}/{targetedDocumentType.Id}";

        Directory.CreateDirectory($"{_environment.ContentRootPath}/approot/ProjectDocuments/{targetedProject.Id}");
        Directory.CreateDirectory(
            $"{_environment.ContentRootPath}/approot/ProjectDocuments/{targetedProject.Id}/{targetedDocumentType.Id}");

        // Saving the file onto the folder
        foreach (IFormFile file in payload.Files)
        {
            string filePath =
                $"{projectDocumentsDirectory}/{file.FileName}";

            // Saving the file locally
            _fileService.SaveFileToDirectory(projectDocumentsDirectory, filePath, file);

            // Saving file data into the database.
            ProjectDocument currentProjectDocument = new ProjectDocument()
            {
                ProjectId = targetedProject.Id,
                UploadedByUserId = currentUser.Id,
                DateUploaded = DateTime.Now,
                DocumentTypeId = targetedDocumentType.Id,
                FileName = file.FileName
            };

            _fileService.InsertProjectDocument(currentProjectDocument);
            Console.WriteLine(file.FileName);
        }

        int recordsChanged = await _projectService.SetCurrentDateTimeToProjectLastUpdated(targetedProject);

        return Ok();
    }

    [HttpGet("{projectId}/search")]
    public IActionResult SearchFilesUnderProject(
        string projectId,
        [FromQuery] DocumentSort sort,
        [FromQuery] string? scope = "ALL",
        [FromQuery] string? query = ""
    )
    {
        if (query == null)
        {
            query = "";
        }

        if (scope == "ALL")
        {
            scope = null;
        }

        List<ProjectDocumentResponse> searchResults = _fileService
            .SearchProjectDocuments(
                projectId: projectId,
                documentTypeId: scope,
                sort: sort,
                query: query
            )
            .Select(x => new ProjectDocumentResponse()
            {
                Id = x.Id,
                ProjectId = x.ProjectId,
                UploadedByUserId = x.UploadedByUserId,
                UploadedByUserName = x.UploadedByUser.FullName,
                DocumentTypeId = x.DocumentTypeId,
                DocumentTypeName = x.DocumentType.Name,
                FileName = x.FileName,
                DateUploaded = x.DateUploaded
            })
            .ToList();

        return Ok(searchResults);
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteDocumentsUnderProject([FromBody] DeleteDocumentsFromProjectForm payload)
    {
        Project? targetedProject = _projectService.GetProjectById(payload.ProjectId);

        if (targetedProject == null)
        {
            return NotFound($"Project with Id {payload.ProjectId} does not exist.");
        }

        bool isPartialCompletion = false;
        Dictionary<string, string> deletionStatus = new Dictionary<string, string>();

        foreach (string documentId in payload.DocumentIdList)
        {
            ProjectDocument? currentDocument = _fileService.GetProjectDocumentById(documentId);

            if (currentDocument == null)
            {
                isPartialCompletion = true;
                deletionStatus.Add($"Failed to delete document with Id {documentId}, document does not exist.", "404");
                continue;
            }

            string filePath =
                $"{_environment.ContentRootPath}/approot/ProjectDocuments/{currentDocument.ProjectId}/{currentDocument.DocumentTypeId}/{currentDocument.FileName}";

            _fileService.DeleteFileFromDirectory(filePath);

            int recordsChanged = _fileService.DeleteDocument(currentDocument);

            if (recordsChanged == 0)
            {
                isPartialCompletion = true;
                deletionStatus.Add($"Failed to delete document with Id {documentId}.", "500");
            }
        }

        await _projectService.SetCurrentDateTimeToProjectLastUpdated(targetedProject!);

        if (isPartialCompletion)
        {
            return StatusCode(207, deletionStatus);
        }

        return Ok("All documents have been deleted successfully.");
    }

    [HttpGet("{documentId}/download")]
    public IActionResult DownloadDocumentById(string documentId)
    {
        ProjectDocument? currentDocument = _fileService.GetProjectDocumentById(documentId);

        if (currentDocument == null)
        {
            return NotFound($"Document with Id {documentId} does not exist.");
        }

        string filePath =
            $"{_environment.ContentRootPath}/approot/ProjectDocuments/{currentDocument.ProjectId}/{currentDocument.DocumentTypeId}/{currentDocument.FileName}";

        FileStream fileStream = _fileService.ReadFileFromDirectory(filePath);

        return new FileStreamResult(fileStream, "application/octet-stream")
        {
            FileDownloadName = currentDocument.FileName
        };
    }

    [HttpGet("{projectId}/slides")]
    public async Task<IActionResult> GeneratePowerpointSlides(string projectId)
    {
        Project? targetedProject = _projectService.GetProjectById(projectId);

        if (targetedProject == null)
        {
            return NotFound($"Project with Id {projectId} does not exist.");
        }

        # region SlidesGeneration

        // This is the file path to store the powerpoint slides
        string filePath =
            $"{_environment.ContentRootPath}/approot/temp/{targetedProject.Id:D}.pptx";

        _fileService.GeneratePowerPointSlides(filePath, targetedProject);
        FileStream slidesFileStream = _fileService.ReadFileFromDirectory(filePath);

        # endregion

        # region LatestDocumentFilePaths

        List<string> latestFilesPath = new List<string>();

        // Building ZIP archive for end user
        ProjectDocument? latestSolutionsDesign = _context.ProjectDocuments
            .Where(x => x.ProjectId == targetedProject.Id &&
                        x.DocumentTypeId == Guid.Parse("00000000000000000000000000000011"))
            .OrderByDescending(x => x.DateUploaded)
            .FirstOrDefault();

        ProjectDocument? latestDocumentation = _context.ProjectDocuments
            .Where(x => x.ProjectId == targetedProject.Id &&
                        x.DocumentTypeId == Guid.Parse("00000000000000000000000000000012"))
            .OrderByDescending(x => x.DateUploaded)
            .FirstOrDefault();

        ProjectDocument? latestCodeScanStatus = _context.ProjectDocuments
            .Where(x => x.ProjectId == targetedProject.Id &&
                        x.DocumentTypeId == Guid.Parse("00000000000000000000000000000013"))
            .OrderByDescending(x => x.DateUploaded)
            .FirstOrDefault();

        if (latestSolutionsDesign != null)
        {
            string latestSolutionsDesignFilePath =
                $"{_environment.ContentRootPath}/approot/ProjectDocuments/{latestSolutionsDesign.ProjectId}/{latestSolutionsDesign.DocumentTypeId}/{latestSolutionsDesign.FileName}";

            latestFilesPath.Add(latestSolutionsDesignFilePath);
        }

        if (latestDocumentation != null)
        {
            string latestDocumentationDesignFilePath =
                $"{_environment.ContentRootPath}/approot/ProjectDocuments/{latestDocumentation.ProjectId}/{latestDocumentation.DocumentTypeId}/{latestDocumentation.FileName}";

            latestFilesPath.Add(latestDocumentationDesignFilePath);
        }

        if (latestCodeScanStatus != null)
        {
            string latestCodeScanStatusFilePath =
                $"{_environment.ContentRootPath}/approot/ProjectDocuments/{latestCodeScanStatus.ProjectId}/{latestCodeScanStatus.DocumentTypeId}/{latestCodeScanStatus.FileName}";

            latestFilesPath.Add(latestCodeScanStatusFilePath);
        }

        # endregion

        #region ZippingFiles

        MemoryStream zipFileMemoryStream = new MemoryStream();
        using (ZipArchive archive = new ZipArchive(zipFileMemoryStream, ZipArchiveMode.Update, leaveOpen: true))
        {
            // Storing latest project documents in zip
            foreach (string path in latestFilesPath)
            {
                string fileName = Path.GetFileName(path);
                var zipEntry = archive.CreateEntry(fileName);

                using (var zipEntryStream = zipEntry.Open())
                using (var zipStream = System.IO.File.OpenRead(path))
                {
                    await zipStream.CopyToAsync(zipEntryStream);
                }
            }

            // Storing slides in zip
            var slidesEntry = archive.CreateEntry($"{targetedProject.Name}.pptx");
            using (var slidesEntryStream = slidesEntry.Open())
            using (var slidesStream = slidesFileStream)
            {
                await slidesStream.CopyToAsync(slidesEntryStream);
            }
        }

        #endregion

        zipFileMemoryStream.Seek(0, SeekOrigin.Begin);

        return new FileStreamResult(zipFileMemoryStream, "application/octet-stream")
        {
            FileDownloadName = $"{targetedProject.Name}_Export.zip"
        };
    }

    [HttpGet("types")]
    public IActionResult GetDocumentTypes()
    {
        return Ok(_fileService.GetAllDocumentTypes());
    }
}