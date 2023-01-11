using System.Security.Cryptography;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMAS_CITI.Enums;
using PMAS_CITI.Models;
using PMAS_CITI.RequestBodies;
using PMAS_CITI.RequestBodies.Risks;
using PMAS_CITI.Services;

namespace PMAS_CITI.Controllers;

[Route("api/projects/risks")]
[ApiController]
[EnableCors("APIPolicy")]
public class RiskController : ControllerBase
{
    private readonly PMASCITIDbContext _context;
    private readonly ProjectService _projectService;
    private readonly RiskService _riskService;

    public RiskController(PMASCITIDbContext context, ProjectService projectService, RiskService riskService)
    {
        _context = context;
        _projectService = projectService;
        _riskService = riskService;
    }

    [HttpGet("search")]
    public IActionResult SearchRisks(
        [FromQuery] string projectId,
        [FromQuery] RiskSort sort,
        [FromQuery] string? query = "",
        [FromQuery] string? category = "ALL"
    )
    {
        if (query == null)
        {
            query = "";
        }

        var genericSearch = _context.ProjectRisks
            .AsNoTracking()
            .Include(x => x.RiskSeverity)
            .Include(x => x.RiskCategory)
            .Include(x => x.RiskLikelihood)
            .Where(x => x.ProjectId.ToString() == projectId &&
                        (x.Description.Contains(query) ||
                         x.Mitigation.Contains(query) ||
                         x.RiskCategory.Name.Contains(query) ||
                         x.RiskCategory.Definition.Contains(query))
            )
            .Select(x => new
            {
                Id = x.Id,
                Category = x.RiskCategory.Name,
                CategoryId = x.RiskCategoryId,
                Definition = x.RiskCategory.Definition,
                Likelihood = x.RiskLikelihood.Name,
                LikelihoodId = x.RiskLikelihoodId,
                Severity = x.RiskSeverity.Name,
                SeverityId = x.RiskSeverityId,
                Mitigation = x.Mitigation,
                Description = x.Description
            });

        if (category != "ALL")
        {
            genericSearch = genericSearch.Where(x => x.CategoryId == Guid.Parse(category));
        }

        switch (sort)
        {
            case RiskSort.SEVERITY_ASC:
                return Ok(genericSearch.OrderBy(x => x.SeverityId));
            case RiskSort.SEVERITY_DESC:
                return Ok(genericSearch.OrderByDescending(x => x.SeverityId));
            case RiskSort.LIKELIHOOD_ASC:
                return Ok(genericSearch.OrderBy(x => x.LikelihoodId));
            case RiskSort.LIKELIHOOD_DESC:
                return Ok(genericSearch.OrderByDescending(x => x.LikelihoodId));
            default:
                return Ok(genericSearch.OrderBy(x => x.SeverityId));
        }
    }

    [HttpDelete("{riskId}")]
    public async Task<IActionResult> DeleteRiskById(string riskId)
    {
        ProjectRisk? targetedRisk = _context.ProjectRisks.SingleOrDefault(x => x.Id.ToString() == riskId);

        if (targetedRisk == null)
        {
            return NotFound($"Risk with Id {riskId} does not exist.");
        }

        _context.ProjectRisks.Remove(targetedRisk);
        int recordsChanged = _context.SaveChanges();

        // Project won't be null, if risk is found, they are bound by a foreign key.
        Project? targetedProject = _projectService.GetProjectById(targetedRisk.ProjectId.ToString());
        recordsChanged += await _projectService.SetCurrentDateTimeToProjectLastUpdated(targetedProject!);

        if (recordsChanged > 0)
        {
            return Ok($"Risk with Id {riskId} has been deleted.");
        }

        return new ContentResult()
        {
            StatusCode = 500,
            Content = $"Failed to delete risk with Id {riskId}."
        };
    }

    [HttpPut("{riskId}")]
    public async Task<IActionResult> UpdateRisk(string riskId, [FromBody] UpdateRiskForm updatedRisk)
    {
        ProjectRisk? targetedRisk = _context.ProjectRisks.SingleOrDefault(x => x.Id.ToString() == riskId);

        if (targetedRisk == null)
        {
            return NotFound($"Risk with Id {riskId} does not exist.");
        }

        targetedRisk.Description = updatedRisk.Description;
        targetedRisk.Mitigation = updatedRisk.Mitigation;

        targetedRisk.RiskLikelihoodId = Guid.Parse(updatedRisk.RiskLikelihoodId);
        targetedRisk.RiskCategoryId = Guid.Parse(updatedRisk.RiskCategoryId);
        targetedRisk.RiskSeverityId = Guid.Parse(updatedRisk.RiskSeverityId);

        int recordsChanged = _context.SaveChanges();

        // Project won't be null, if risk is found, they are bound by a foreign key.
        Project? targetedProject = _projectService.GetProjectById(targetedRisk.ProjectId.ToString());
        recordsChanged += await _projectService.SetCurrentDateTimeToProjectLastUpdated(targetedProject!);

        if (recordsChanged > 0)
        {
            return Ok($"Risk with Id {riskId} has been updated.");
        }

        return new ContentResult()
        {
            StatusCode = 500,
            Content = $"Failed to update risk with Id {riskId}."
        };
    }

    [HttpPost]
    public async Task<IActionResult> NewRisk([FromBody] NewRiskForm newRiskForm)
    {
        Project? targetedProject = _projectService.GetProjectById(newRiskForm.ProjectId);

        if (targetedProject == null)
        {
            return NotFound($"Project with Id {newRiskForm.ProjectId} does not exist.");
        }

        _context.ProjectRisks.Add(new ProjectRisk()
        {
            Mitigation = newRiskForm.Mitigation,
            Description = newRiskForm.Description,
            RiskCategoryId = Guid.Parse(newRiskForm.CategoryId),
            RiskLikelihoodId = Guid.Parse(newRiskForm.LikelihoodId),
            RiskSeverityId = Guid.Parse(newRiskForm.SeverityId),
            ProjectId = targetedProject.Id
        });

        int recordsChanged = _context.SaveChanges();
        recordsChanged += await _projectService.SetCurrentDateTimeToProjectLastUpdated(targetedProject!);

        if (recordsChanged > 0)
        {
            return Ok($"Risk has been added to project with Id {targetedProject.Id}.");
        }

        return new ContentResult()
        {
            StatusCode = 500,
            Content = $"Failed to add risk to project with Id {targetedProject.Id}."
        };
    }

    [HttpGet("{riskId}")]
    public IActionResult GetRiskById(string riskId)
    {
        ProjectRisk? targetedRisk = _context.ProjectRisks.SingleOrDefault(x => x.Id.ToString() == riskId);

        if (targetedRisk == null)
        {
            return NotFound($"Risk with Id {riskId} does not exist.");
        }

        return Ok(targetedRisk);
    }

    [HttpGet]
    public IActionResult GetRisks([FromQuery] string projectId)
    {
        return Ok(_context.ProjectRisks
            .AsNoTracking()
            .Include(x => x.RiskSeverity)
            .Include(x => x.RiskCategory)
            .Include(x => x.RiskLikelihood)
            .Where(x => x.ProjectId.ToString() == projectId)
            .Select(x => new
            {
                Id = x.Id,
                Category = x.RiskCategory.Name,
                Definition = x.RiskCategory.Definition,
                Likelihood = x.RiskLikelihood.Name,
                Severity = x.RiskSeverity.Name,
                Mitigation = x.Mitigation,
                Description = x.Description
            }));
    }

    [HttpGet("likelihoods")]
    public IActionResult GetRiskLikelihoods()
    {
        return Ok(_context.RiskLikelihoods.Select(x => new
        {
            Id = x.Id,
            Name = x.Name
        }));
    }

    [HttpGet("severities")]
    public IActionResult GetRiskSeverities()
    {
        return Ok(_context.RiskSeverities.Select(x => new
        {
            Id = x.Id,
            Name = x.Name
        }));
    }

    [HttpGet("categories")]
    public IActionResult GetRiskCategories()
    {
        return Ok(_context.RiskCategories.Select(x => new
        {
            Id = x.Id,
            Name = x.Name,
            Definition = x.Definition
        }));
    }
    [HttpGet("test")]

    public List<ProjectRisk> testQueryRisks(string projectId)
    {
        return _riskService.QueryRisks(projectId);
    }



}