using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using PMAS_CITI.AzureDevOps;
using PMAS_CITI.AzureDevOps.Models;
using PMAS_CITI.AzureDevOps.Models.Commit;
using PMAS_CITI.AzureDevOps.Models.Repository;
using PMAS_CITI.Enums;
using PMAS_CITI.Services;
using System.ComponentModel;
using PMAS_CITI.Models;
using PMAS_CITI.RequestBodies;
using System.Security.Claims;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.SqlServer.Query.Internal;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace PMAS_CITI.Controllers;

[Route("api/azure-dev-ops")]
[ApiController]
[EnableCors("APIPolicy")]
public class AzureDevOpsController : ControllerBase
{
    private readonly AzureDevOpsHelper _azureDevOps;
    private readonly ProjectService _projectService;
    private readonly RiskService _riskService;
    


    public AzureDevOpsController(AzureDevOpsHelper azureDevOps, ProjectService projectService, RiskService riskService)
    {
        _azureDevOps = azureDevOps;
        _projectService = projectService;
        _riskService = riskService;
        
    }

    [HttpGet("projects")]
    public async Task<IActionResult> GetProjects()
    {
        return Ok(await _azureDevOps.GetProjects());
    }

    [HttpGet("{projectId}/commits")]
    public async Task<IActionResult> GetCommitCountForProject(
        string projectId,
        [FromQuery] bool isHeatmapData = true,
        [FromQuery] int take = 0,
        [FromQuery] int skip = 0
    )
    {
        AzureRepositoryList? repositoriesUnderProject = await _azureDevOps.GetRepositoriesForProject(projectId)
            .ConfigureAwait(false);

        if (repositoriesUnderProject == null)
        {
            return NotFound($"No repositories found for project with Id {projectId}.");
        }

        var commitsUnderProject = repositoriesUnderProject.Value
            .Select(repo => _azureDevOps
                .GetCommitsForProject(projectId, repo.Id)
                .Result?
                .Value
                .Select(commit => new
                {
                    CommitId = commit.CommitId,
                    Author = commit.Author,
                    Committer = commit.Committer,
                    Comment = commit.Comment,
                    ChangeCounts = commit.ChangeCounts,
                    Url = commit.Url,
                    RemoteUrl = commit.RemoteUrl,
                    Repository = repo
                }))
            .SelectMany(commit => commit)
            .OrderByDescending(commit => commit.Committer.Date)
            .ToList();

        if (take != 0)
        {
            commitsUnderProject = commitsUnderProject
                .Take(take)
                .Skip(take * skip)
                .ToList();
        }

        if (isHeatmapData)
        {
            var result = commitsUnderProject
                .GroupBy(x => x.Author.Date.Date)
                .Select(x => new
                {
                    Date = x.Key,
                    Count = x.Count()
                });

            return Ok(result);
        }

        return Ok(commitsUnderProject);
    }

    [HttpGet("{projectId}/{repositoryId}/commits")]
    public async Task<IActionResult> GetCommitsForProject(
        string projectId,
        string repositoryId = "_all",
        [FromQuery] int take = 0,
        [FromQuery] int skip = 0
    )
    {
        if (repositoryId == "_all")
        {
            AzureRepositoryList? repositoriesUnderProject = await _azureDevOps.GetRepositoriesForProject(projectId)
                .ConfigureAwait(false);

            if (repositoriesUnderProject == null)
            {
                return NotFound($"No repositories found for project with Id {projectId}.");
            }

            List<CommitsWithRepository> commitsWithRepositoryList = new List<CommitsWithRepository>();

            foreach (AzureRepository repo in repositoriesUnderProject.Value)
            {
                AzureCommitList? commitsUnderRepository = await _azureDevOps.GetCommitsForProject(projectId, repo.Id);

                if (commitsUnderRepository == null)
                {
                    continue;
                }

                commitsWithRepositoryList.Add(new CommitsWithRepository()
                {
                    Repository = repo,
                    Commits = commitsUnderRepository
                }
                );
            }

            return Ok(commitsWithRepositoryList);
        }

        return Ok(await _azureDevOps.GetCommitsForProject(projectId, repositoryId, take, skip));
    }

    [HttpGet("{projectId}/repositories")]
    public async Task<IActionResult> GetRepositoriesForProject(string projectId)
    {
        return Ok(await _azureDevOps.GetRepositoriesForProject(projectId));
    }


    [HttpGet("{projectId}/Generate-Report")]
    public async Task<IActionResult> OnPostGenerateReport(string projectId)
    {
        string TempData = "";
        Project project = _projectService.GetProjectById(projectId)!;
        StringContent reportContent = _azureDevOps.GenerateReportStringContent(project);
        string? reportUrl = await _azureDevOps.GenerateReport(project.AzureProjectId!, reportContent);
        if (reportUrl != null)
        {
            TempData = reportUrl;
        }
        else
        {
            TempData = "Failed to generate report";
        }
        return Ok(TempData);

    }






}