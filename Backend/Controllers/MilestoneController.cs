using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using PMAS_CITI.Enums;
using PMAS_CITI.Models;
using PMAS_CITI.RequestBodies;
using PMAS_CITI.RequestBodies.Milestones;
using PMAS_CITI.Services;

namespace PMAS_CITI.Controllers;

// TODO: Check if user is part of project and is either PROJECT_MANAGER or PROJECT_LEAD before allowing them to do anything.
[Route("api/milestones")]
[ApiController]
[EnableCors("APIPolicy")]
public class MilestoneController : ControllerBase
{
    private readonly ProjectService _projectService;
    private readonly MilestoneService _milestoneService;
    private readonly TaskService _taskService;
    private readonly PMASCITIDbContext _context;
    private readonly NotificationService _notificationService;

    public MilestoneController(MilestoneService milestoneService, TaskService taskService, PMASCITIDbContext context,
        ProjectService projectService, NotificationService notificationService)
    {
        _milestoneService = milestoneService;
        _taskService = taskService;
        _context = context;
        _projectService = projectService;
        _notificationService = notificationService;
    }

    [HttpGet("{milestoneId}")]
    public IActionResult GetMilestoneById(string milestoneId)
    {
        ProjectMilestone? milestone = _milestoneService.GetMilestoneById(milestoneId);
        if (milestone == null)
        {
            return NotFound($"Milestone with Id {milestoneId} does not exist.");
        }

        return Ok(milestone);
    }
    
    [HttpGet("search")]
    public IActionResult SearchMilestones(
        [FromQuery] string? projectId = "",
        [FromQuery] MilestoneScope scope = MilestoneScope.ALL,
        [FromQuery] MilestoneSort sort = MilestoneSort.DATE_CREATED_DESC,
        [FromQuery] string? query = ""
    )
    {
        if (query == null || query.Trim() == "")
        {
            query = "";
        }

        List<ProjectMilestone> searchResults = _milestoneService.SearchMilestones(
            projectId: projectId,
            scope: scope,
            sort: sort,
            query: query
        );

        return Ok(searchResults);
    }


    [HttpGet("{projectId}/incomplete-milestones")]
    public IActionResult GetIncompletedMilestonesForProject(string projectId)
    {
        return Ok(_milestoneService
            .GetIncompleteMilestonesByProjectId(projectId)
        );
    }

    [HttpGet("{milestoneId}/status")]
    public IActionResult GetMilestoneStatus(string milestoneId)
    {
        ProjectMilestone? targetedMilestone = _milestoneService.GetMilestoneById(milestoneId);

        if (targetedMilestone == null)
        {
            return NotFound($"Milestone with Id {milestoneId} does not exist.");
        }

        MilestoneStatus? milestoneStatus = _milestoneService.GetMilestoneStatus(targetedMilestone);

        if (milestoneStatus != null)
        {
            return Ok(milestoneStatus.Value.ToString());
        }

        return Ok(nameof(MilestoneStatus.ONGOING));
    }

    [HttpPut]
    public async Task<IActionResult> UpdateMilestone([FromBody] UpdateMilestoneForm updateMilestoneForm)
    {
        ProjectMilestone? targetedMilestone = _milestoneService.GetMilestoneById(updateMilestoneForm.Id);
        if (targetedMilestone == null)
        {
            return NotFound($"Milestone with Id {updateMilestoneForm.Id} does not exist.");
        }

        targetedMilestone.Name = updateMilestoneForm.Name;
        targetedMilestone.Description = updateMilestoneForm.Description;
        targetedMilestone.DateProjectedStart = updateMilestoneForm.DateProjectedStart;
        targetedMilestone.DateProjectedEnd = updateMilestoneForm.DateProjectedEnd;
        targetedMilestone.DateActualStart = updateMilestoneForm.DateActualStart;
        targetedMilestone.DateUpdated = DateTime.Now;
        targetedMilestone.PaymentPercentage = updateMilestoneForm.PaymentPercentage;

        int recordsChanged = _context.SaveChanges();

        // Updating the project last updated 
        // Project won't be null because milestone is not null
        Project? targetedProject = _projectService.GetProjectById(targetedMilestone.ProjectId.ToString());
        recordsChanged += await _projectService.SetCurrentDateTimeToProjectLastUpdated(targetedProject);

        _milestoneService.QueueNotificationForMilestoneCompletionOverdue(targetedMilestone);
        _milestoneService.QueueNotificationForMilestonePaymentOverdue(targetedMilestone);

        if (recordsChanged > 0)
        {
            return Ok($"Milestone with Id {updateMilestoneForm.Id} has been successfully updated.");
        }

        return new ContentResult()
        {
            StatusCode = 500,
            Content = $"Failed to update milestone with Id {updateMilestoneForm.Id}"
        };
    }

    [HttpPut("{milestoneId}/payment-percentage")]
    public async Task<IActionResult> UpdateMilestonePaymentPercentage(
        string milestoneId,
        [FromBody] NewPaymentPercentageForm payload
    )
    {
        ProjectMilestone? targetedMilestone = _milestoneService.GetMilestoneById(milestoneId);
        if (targetedMilestone == null)
        {
            return NotFound($"Milestone with Id {milestoneId} does not exist.");
        }

        targetedMilestone.PaymentPercentage = payload.NewPaymentPercentage;

        int recordsChanged = _context.SaveChanges();

        // Updating the project last updated 
        // Project won't be null because milestone is not null
        Project? targetedProject = _projectService.GetProjectById(targetedMilestone.ProjectId.ToString());
        recordsChanged += await _projectService.SetCurrentDateTimeToProjectLastUpdated(targetedProject);
        
        _milestoneService.QueueNotificationForMilestoneCompletionOverdue(targetedMilestone);
        _milestoneService.QueueNotificationForMilestonePaymentOverdue(targetedMilestone);

        if (recordsChanged > 0)
        {
            return Ok($"Milestone with Id {milestoneId} has been successfully updated.");
        }

        return new ContentResult()
        {
            StatusCode = 500,
            Content = $"Failed to update milestone with Id {milestoneId}"
        };
    }
    
    [HttpPatch("{milestoneId}/mark-as-completed")]
    public async Task<IActionResult> MarkMilestoneAsCompletedById(string milestoneId)
    {
        ProjectMilestone? targetedMilestone = _milestoneService.GetMilestoneById(milestoneId);

        if (targetedMilestone == null)
        {
            return NotFound($"Milestone with Id {milestoneId} does not exist.");
        }

        // Checking if all tasks from milestones has been completed.
        List<ProjectTask> incompleteTasks = _taskService.GetIncompleteTasksByMilestoneId(milestoneId);

        if (incompleteTasks.Any())
        {
            return new ContentResult()
            {
                StatusCode = 417,
                Content = JsonConvert.SerializeObject(incompleteTasks),
                ContentType = "application/json"
            };
        }

        targetedMilestone.IsCompleted = true;
        targetedMilestone.DateActualEnd = DateTime.Now;

        // Updating the project last updated 

        int recordsChanged = _context.SaveChanges();

        // Project won't be null because milestone is not null
        Project? targetedProject = _projectService.GetProjectById(targetedMilestone.ProjectId.ToString());
        recordsChanged += await _projectService.SetCurrentDateTimeToProjectLastUpdated(targetedProject);
        _milestoneService.QueueNotificationForMilestoneCompletionOverdue(targetedMilestone);
        _milestoneService.QueueNotificationForMilestonePaymentOverdue(targetedMilestone);

        if (recordsChanged > 0)
        {
            return Ok($"Milestone with Id {milestoneId} has been marked as completed.");
        }

        return new ContentResult()
        {
            StatusCode = 500,
            Content = $"Failed to mark milestone with Id {milestoneId} as compeleted"
        };
    }

    [HttpPatch("{milestoneId}/mark-as-paid")]
    public async Task<IActionResult> MarkMilestoneAsPaid(string milestoneId)
    {
        ProjectMilestone? targetedMilestone = _milestoneService.GetMilestoneById(milestoneId);

        if (targetedMilestone == null)
        {
            return NotFound($"Milestone with Id {milestoneId} does not exist.");
        }

        if (!targetedMilestone.IsCompleted)
        {
            return new ContentResult()
            {
                StatusCode = 417,
                Content = $"Milestone with Id {milestoneId} should be marked completed before it can be marked as paid."
            };
        }

        if (targetedMilestone.IsPaid)
        {
            return new ContentResult()
            {
                StatusCode = 409,
                Content = $"Milestone with Id {milestoneId} is already marked as paid."
            };
        }

        targetedMilestone.IsPaid = true;
        targetedMilestone.DatePaid = DateTime.Now;
        int recordsChanged = _context.SaveChanges();

        // Project won't be null because milestone is not null
        Project? targetedProject = _projectService.GetProjectById(targetedMilestone.ProjectId.ToString());
        recordsChanged += await _projectService.SetCurrentDateTimeToProjectLastUpdated(targetedProject);
        _milestoneService.QueueNotificationForMilestoneCompletionOverdue(targetedMilestone);
        _milestoneService.QueueNotificationForMilestonePaymentOverdue(targetedMilestone);

        if (recordsChanged > 0)
        {
            return Ok($"Milestone with Id {milestoneId} has been marked as completed.");
        }

        return new ContentResult()
        {
            StatusCode = 500,
            Content = $"Failed to mark milestone with Id {milestoneId} as compeleted"
        };
    }

    [HttpGet("{milestoneId}/verify-tasks")]
    public IActionResult VerifyTasksCompletion(string milestoneId)
    {
        ProjectMilestone? targetedMilestone = _milestoneService.GetMilestoneById(milestoneId);

        if (targetedMilestone == null)
        {
            return NotFound($"Milestone with Id {milestoneId} does not exist.");
        }

        List<ProjectTask> incompleteTasks = _taskService.GetIncompleteTasksByMilestoneId(milestoneId);

        if (incompleteTasks.Any())
        {
            return new ContentResult()
            {
                StatusCode = 417,
                Content = JsonConvert.SerializeObject(incompleteTasks),
                ContentType = "application/json"
            };
        }

        return Ok();
    }

    [HttpGet("{milestoneId}/progress")]
    public IActionResult GetMilestoneCompletionProgress(string milestoneId)
    {
        ProjectMilestone? targetedMilestone = _milestoneService.GetMilestoneById(milestoneId);

        if (targetedMilestone == null)
        {
            return NotFound($"Milestone with Id {milestoneId} does not exist.");
        }

        return Ok(_milestoneService.GetMilestoneCompletionProgress(targetedMilestone));
    }

    [HttpDelete("{milestoneId}")]
    public async Task<IActionResult> DeleteMilestoneById(string milestoneId)
    {
        ProjectMilestone? targetedMilestone = _milestoneService.GetMilestoneById(milestoneId);

        if (targetedMilestone == null)
        {
            return NotFound($"Milestone with Id {milestoneId} does not exist.");
        }

        int recordsChanged = _milestoneService.DeleteMilestone(targetedMilestone);

        // Project won't be null because milestone is not null
        Project? targetedProject = _projectService.GetProjectById(targetedMilestone.ProjectId.ToString());
        recordsChanged += await _projectService.SetCurrentDateTimeToProjectLastUpdated(targetedProject);
        await _notificationService.RemoveAllNotificationsForMilestone(targetedMilestone);

        if (recordsChanged > 0)
        {
            return Ok($"Milestone with Id {milestoneId} has been deleted.");
        }

        return new ContentResult()
        {
            StatusCode = 500,
            Content = $"Failed to delete milestone with Id {milestoneId}."
        };
    }

    [HttpPost]
    public async Task<IActionResult> InsertMilestone([FromBody] NewMilestoneForm newMilestoneForm)
    {
        Project? targetedProject = _projectService.GetProjectById(newMilestoneForm.ProjectId);

        if (targetedProject == null)
        {
            return NotFound($"Project with Id {newMilestoneForm.ProjectId} does not exist.");
        }

        ProjectMilestone newMilestone = new ProjectMilestone()
        {
            Id = Guid.NewGuid(),
            Name = newMilestoneForm.Name,
            Description = newMilestoneForm.Description,
            DateProjectedStart = newMilestoneForm.DateProjectedStart,
            DateProjectedEnd = newMilestoneForm.DateProjectedEnd,
            DateActualStart = newMilestoneForm.DateActualStart,
            PaymentPercentage = newMilestoneForm.PaymentPercentage,
            ProjectId = Guid.Parse(newMilestoneForm.ProjectId),
            DateCreated = DateTime.Now,
            DateUpdated = DateTime.Now
        };

        int recordsChanged = _milestoneService.InsertMilestone(newMilestone);

        // Project won't be null because milestone is not null
        recordsChanged += await _projectService.SetCurrentDateTimeToProjectLastUpdated(targetedProject);
        _milestoneService.QueueNotificationForMilestoneCompletionOverdue(newMilestone);

        if (recordsChanged > 0)
        {
            return Ok("Milestone has been inserted.");
        }

        return new ContentResult()
        {
            StatusCode = 500,
            Content = "Failed to insert milestone."
        };
    }

   

}