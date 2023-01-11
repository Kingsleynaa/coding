using System.Security.Cryptography;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMAS_CITI.Models;
using PMAS_CITI.RequestBodies;
using PMAS_CITI.RequestBodies.Requirements;
using PMAS_CITI.Services;

namespace PMAS_CITI.Controllers;

[Route("api/projects/requirements")]
[ApiController]
[EnableCors("APIPolicy")]
public class RequirementController : ControllerBase
{
    private readonly PMASCITIDbContext _context;
    private readonly ProjectService _projectService;

    public RequirementController(PMASCITIDbContext context, ProjectService projectService)
    {
        _context = context;
        _projectService = projectService;
    }

    [HttpPut("{requirementId}")]
    public async Task<IActionResult> UpdateRequirement(string requirementId, UpdateRequirementForm updatedRequirement)
    {
        ProjectRequirement? targetedRequirement =
            _context.ProjectRequirements
                .SingleOrDefault(x => x.Id.ToString() == requirementId);

        if (targetedRequirement == null)
        {
            return NotFound($"Requirement with Id {requirementId} does not exist.");
        }

        targetedRequirement.Name = updatedRequirement.Name;
        targetedRequirement.Description = updatedRequirement.Description;
        targetedRequirement.RequirementTypeId = Guid.Parse(updatedRequirement.RequirementTypeId);

        int recordsChanged = _context.SaveChanges();

        // If requirement is found, project won't be null
        Project? targetedProject = _projectService.GetProjectById(targetedRequirement.ProjectId.ToString());
        recordsChanged += await _projectService.SetCurrentDateTimeToProjectLastUpdated(targetedProject);

        if (recordsChanged > 0)
        {
            return Ok($"Requirement with Id {requirementId} has been updated.");
        }

        return new ContentResult()
        {
            StatusCode = 500,
            Content = $"Unable to update requirement with Id {requirementId}."
        };
    }

    [HttpDelete("{requirementId}")]
    public async Task<IActionResult> DeleteRequirementById(string requirementId)
    {
        ProjectRequirement? requirement =
            _context.ProjectRequirements
                .SingleOrDefault(x => x.Id.ToString() == requirementId);

        if (requirement == null)
        {
            return NotFound($"Requirement with Id {requirementId} does not exist.");
        }

        _context.ProjectRequirements.Remove(requirement);
        int recordsChanged = _context.SaveChanges();

        Project? targetedProject = _projectService.GetProjectById(requirement.ProjectId.ToString());
        recordsChanged += await _projectService.SetCurrentDateTimeToProjectLastUpdated(targetedProject);

        if (recordsChanged > 0)
        {
            return Ok($"Requirement with Id {requirementId} has been deleted.");
        }

        return new ContentResult()
        {
            StatusCode = 500,
            Content = $"Failed to delete requirement with Id {requirementId}."
        };
    }

    [HttpDelete]
    public async Task<IActionResult> BatchDeleteRequirementsById([FromBody] List<string> requirementIdList)
    {
        IQueryable<ProjectRequirement> requirementsToBeRemoved =
            _context.ProjectRequirements
                .AsNoTracking()
                .Where(x => requirementIdList.Contains(x.Id.ToString()));

        _context.RemoveRange(requirementsToBeRemoved);

        int recordsChanged = 0;

        foreach (ProjectRequirement requirement in requirementsToBeRemoved)
        {
            Project? targetedProject = _projectService.GetProjectById(requirement.ProjectId.ToString());
            recordsChanged += await _projectService.SetCurrentDateTimeToProjectLastUpdated(targetedProject);
        }

        recordsChanged += _context.SaveChanges();

        if (recordsChanged > 0)
        {
            return Ok();
        }

        return new ContentResult()
        {
            StatusCode = 500,
            Content = $"Failed to delete requirements."
        };
    }

    [HttpGet("search")]
    public IActionResult SearchRequirements(
        [FromQuery] string projectId,
        [FromQuery] string? query = "",
        [FromQuery] string scope = "ALL"
    )
    {
        Project? targetedProject = _context.Projects.SingleOrDefault(x => x.Id.ToString() == projectId);
        if (targetedProject == null)
        {
            return NotFound($"Project with Id {projectId} does not exist.");
        }

        if (query == null)
        {
            query = "";
        }

        var genericSearchQuery = _context.ProjectRequirements
            .AsNoTracking()
            .Include(x => x.RequirementType)
            .Where(x => x.ProjectId == Guid.Parse(projectId) &&
                        (
                            x.Name.Contains(query) ||
                            x.Description.Contains(query) ||
                            x.RequirementType.Name.Contains(query)
                        )
            )
            .Select(x => new
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                RequirementType = x.RequirementType.Name,
                RequirementTypeId = x.RequirementTypeId
            });

        if (scope == "ALL")
        {
            return Ok(genericSearchQuery);
        }

        return Ok(genericSearchQuery
            .Where(x => x.RequirementTypeId == Guid.Parse(scope)));
    }

    [HttpGet("types")]
    public IActionResult GetRequirementTypes()
    {
        var projectRequirementTypes = _context.ProjectRequirementTypes
            .Select(x => new
            {
                Id = x.Id,
                Name = x.Name
            });

        return Ok(projectRequirementTypes);
    }

    [HttpPost]
    public async Task<IActionResult> NewRequirement([FromBody] NewRequirementForm newRequirementForm)
    {
        Project? targetedProject =
            _context.Projects
                .AsNoTracking()
                .SingleOrDefault(x => x.Id.ToString() == newRequirementForm.ProjectId);

        if (targetedProject == null)
        {
            return NotFound($"Project with Id {newRequirementForm.ProjectId} does not exist.");
        }

        ProjectRequirementType? targetedRequirementType =
            _context.ProjectRequirementTypes
                .AsNoTracking()
                .SingleOrDefault(x => x.Id.ToString() == newRequirementForm.RequirementTypeId);

        if (targetedRequirementType == null)
        {
            return NotFound($"Requirement type with Id {newRequirementForm.RequirementTypeId} does not exist.");
        }

        // TODO: Keep track of when the requirement is added.
        _context.ProjectRequirements.Add(new ProjectRequirement()
        {
            Name = newRequirementForm.Name,
            Description = newRequirementForm.Description,
            ProjectId = targetedProject.Id,
            RequirementTypeId = targetedRequirementType.Id
        });

        int recordsChanged = _context.SaveChanges();
        recordsChanged += await _projectService.SetCurrentDateTimeToProjectLastUpdated(targetedProject);

        if (recordsChanged > 0)
        {
            return Ok($"Requirement have been added for project with Id {targetedProject.Id}.");
        }

        return new ContentResult()
        {
            StatusCode = 500,
            Content = $"Failed to add requirement for project with Id {targetedProject.Id}."
        };
    }
}