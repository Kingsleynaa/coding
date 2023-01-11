using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMAS_CITI.Enums;
using PMAS_CITI.Models;
using PMAS_CITI.RequestBodies;
using PMAS_CITI.RequestBodies.Tasks;
using PMAS_CITI.Services;

namespace PMAS_CITI.Controllers;

[Route("api/milestones/tasks")]
[ApiController]
[EnableCors("APIPolicy")]
public class TaskController : ControllerBase
{
    private readonly TaskService _taskService;
    private readonly PMASCITIDbContext _context;
    private readonly MilestoneService _milestoneService;
    private readonly ProjectService _projectService;

    public TaskController(TaskService taskService, PMASCITIDbContext context, MilestoneService milestoneService,
        ProjectService projectService)
    {
        _taskService = taskService;
        _context = context;
        _milestoneService = milestoneService;
        _projectService = projectService;
    }

    [HttpPost]
    public async Task<IActionResult> InsertTask([FromBody] NewTaskForm newTaskForm)
    {
        ProjectMilestone? parentMilestone = _milestoneService.GetMilestoneById(newTaskForm.MilestoneId);

        if (parentMilestone == null)
        {
            return NotFound($"Milestone with Id {newTaskForm.MilestoneId} is not found");
        }

        Guid taskId = Guid.NewGuid();

        int taskCreation = _taskService.InsertTask(new ProjectTask()
        {
            Id = taskId,
            Name = newTaskForm.Name,
            Description = newTaskForm.Description,
            MilestoneId = parentMilestone.Id,
            DateCreated = DateTime.Now,
            DateUpdated = DateTime.Now
        });

        int taskAssignees = _taskService.AssignMembersToTask(
            newTaskForm.AssignedToUserIdList, taskId.ToString()
        );

        Project? targetedProject = _projectService.GetProjectById(parentMilestone.ProjectId.ToString());
        int projectRecordsChanged = await _projectService.SetCurrentDateTimeToProjectLastUpdated(targetedProject!);

        if ((taskCreation + projectRecordsChanged + taskAssignees) > 0)
        {
            // Set milestone to incomplete if new task is added.
            parentMilestone.IsCompleted = false;
            parentMilestone.IsPaid = false;
            _context.SaveChanges();
            return Ok("Task has been inserted and assigned to its respective members.");
        }

        return new ContentResult()
        {
            StatusCode = 500,
            Content = "Failed to insert task"
        };
    }

    [HttpGet("search")]
    public IActionResult SearchTasks(
        [FromQuery] string milestoneId,
        [FromQuery] TaskScope scope,
        [FromQuery] string? query = ""
    )
    {
        if (query == null)
        {
            query = "";
        }

        ProjectMilestone? targetedMilestone = _context.ProjectMilestones
            .AsNoTracking()
            .SingleOrDefault(m => m.Id.ToString() == milestoneId);

        if (targetedMilestone == null)
        {
            return NotFound($"Milestone with Id {milestoneId} does not exist");
        }

        var genericSearch = _context.ProjectTasks
            .Where(x => x.MilestoneId == targetedMilestone.Id &&
                        (x.Description.Contains(query) ||
                         x.Name.Contains(query)))
            .Select(x => new
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                IsCompleted = x.IsCompleted,
                DateCreated = x.DateCreated,
                DateUpdated = x.DateUpdated,
                MilestoneId = milestoneId,
            });

        switch (scope)
        {
            case TaskScope.ALL:
                return Ok(genericSearch);
            case TaskScope.ONGOING:
                return Ok(genericSearch.Where(x => !x.IsCompleted));
            case TaskScope.COMPLETED:
                return Ok(genericSearch.Where(x => x.IsCompleted));
            default:
                return Ok(genericSearch);
        }
    }

    [HttpGet]
    public IActionResult GetTaskByMilestoneId([FromQuery] string milestoneId)
    {
        ProjectMilestone? targetedMilestone =
            _context.ProjectMilestones.SingleOrDefault(m => m.Id.ToString() == milestoneId);

        if (targetedMilestone == null)
        {
            return NotFound($"Milestone with Id {milestoneId} does not exist");
        }

        // Returning a custom object to prevent object recursion/cycling.
        // In this case: task => milestone => task => milestone 
        var targetedTasks = _context.ProjectTasks
            .Where(x => x.MilestoneId.ToString() == milestoneId)
            .Select(x => new
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                IsCompleted = x.IsCompleted,
                DateCreated = x.DateCreated,
                DateUpdated = x.DateUpdated,
                MilestoneId = milestoneId,
            })
            .ToList();

        return Ok(targetedTasks);
    }

    [HttpGet("TaskData")]
    public IActionResult GetTaskData([FromQuery] string projectId)
    {
        ProjectMemberTask? targetedproj =
            _context.ProjectMemberTasks.FirstOrDefault(pmt => pmt.ProjectId.ToString() == projectId);

        if (targetedproj == null)
        {
            return NotFound($"Project with Id {projectId} does not exist");
        }

        // Returning a custom object to prevent object recursion/cycling.
        // In this case: task => milestone => task => milestone 
        var targetedData = _context.ProjectMemberTasks
            .Where(x => x.ProjectId.ToString() == projectId)
            .Select(x => new
            {
                projectId = x.ProjectId,
                userId = x.UserId,
                taskId = x.TaskId,
                DateAssigned = x.DateAssigned,
            })
            .ToList();

        return Ok(targetedData);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateTask([FromBody] UpdateTaskForm updateTaskForm)
    {
        ProjectTask? targetedTask = _context.ProjectTasks
            .Include(x => x.Milestone)
            .SingleOrDefault(t => t.Id.ToString() == updateTaskForm.Id);

        if (targetedTask == null)
        {
            return NotFound($"Task with Id {updateTaskForm.Id} does not exist.");
        }

        targetedTask.DateUpdated = DateTime.Now;
        targetedTask.Description = updateTaskForm.Description;
        targetedTask.Name = updateTaskForm.Name;

        int recordsChanged = await _context.SaveChangesAsync();

        Project? targetedProject = _projectService.GetProjectById(targetedTask.Milestone.ProjectId.ToString());
        recordsChanged += await _projectService.SetCurrentDateTimeToProjectLastUpdated(targetedProject!);

        if (recordsChanged > 0)
        {
            return Ok($"Task with Id {updateTaskForm.Id} has been successfully update.");
        }

        return new ContentResult()
        {
            StatusCode = 500,
            Content = $"Unable to update task with Id {updateTaskForm.Id}"
        };
    }

    [HttpGet("{taskId}")]
    public IActionResult GetTaskById(string taskId)
    {
        ProjectTask? task = _taskService.GetTaskById(taskId);
        if (task == null)
        {
            return NotFound($"Task with Id ${taskId} does not exist.");
        }

        return Ok(task);
    }

    [HttpDelete("{taskId}")]
    public async Task<IActionResult> DeleteTaskById(string taskId)
    {
        ProjectTask? targetedTask = _context.ProjectTasks
            .Include(x => x.Milestone)
            .SingleOrDefault(t => t.Id == Guid.Parse(taskId));

        if (targetedTask == null)
        {
            return NotFound($"Task with Id ${taskId} does not exist.");
        }

        int recordsChanged = _taskService.DeleteTask(targetedTask);

        Project? targetedProject = _projectService.GetProjectById(targetedTask.Milestone.ProjectId.ToString());
        recordsChanged += await _projectService.SetCurrentDateTimeToProjectLastUpdated(targetedProject!);

        if (recordsChanged == -1)
        {
            return NotFound($"Task with Id ${taskId} does not exist.");
        }

        if (recordsChanged > 0)
        {
            return Ok($"Task with Id ${taskId} has been deleted.");
        }

        return new ContentResult()
        {
            StatusCode = 500,
            Content = $"Failed to delete task with Id {taskId};"
        };
    }

    [HttpPut("{taskId}/members")]
    public async Task<IActionResult> AddMembersToTask(string taskId, [FromBody] AddMembersToTaskForm addMembersToTaskForm)
    {
        ProjectTask? targetedTask = _context.ProjectTasks
            .Include(t => t.Milestone)
            .SingleOrDefault(t => t.Id.ToString() == taskId);

        if (targetedTask == null)
        {
            return NotFound($"Task with Id {taskId} does not exist.");
        }

        foreach (string userId in addMembersToTaskForm.UserIdList)
        {
            ProjectMember? currentMember = _context.ProjectMembers
                .SingleOrDefault(x => x.UserId == Guid.Parse(userId));

            if (currentMember == null)
            {
                continue;
            }

            ProjectMemberTask assignment = new ProjectMemberTask()
            {
                DateAssigned = DateTime.Now,
                TaskId = targetedTask.Id,
                ProjectMember = currentMember
            };

            _context.Add(assignment);
        }

        int recordsChanged = _context.SaveChanges();

        Project? targetedProject = _projectService.GetProjectById(targetedTask.Milestone.ProjectId.ToString());
        recordsChanged += await _projectService.SetCurrentDateTimeToProjectLastUpdated(targetedProject!);

        if (recordsChanged > 0)
        {
            return Ok($"Members have been added to task with Id {targetedTask.Id}.");
        }

        return new ContentResult()
        {
            StatusCode = 500,
            Content = $"Failed to add members into task with Id {targetedTask.Id}."
        };
    }

    [HttpDelete("{taskId}/members/{userId}")]
    public async Task<IActionResult> RemoveMemberFromTask(string taskId, string userId)
    {
        ProjectTask? targetedTask = _context.ProjectTasks
            .SingleOrDefault(t => t.Id == Guid.Parse(taskId));

        if (targetedTask == null)
        {
            return NotFound($"Task with Id {taskId} does not exist.");
        }

        ProjectMemberTask? targetedMember =
            _context.ProjectMemberTasks.SingleOrDefault(p =>
                p.TaskId.ToString() == taskId && p.UserId.ToString() == userId);

        if (targetedMember == null)
        {
            return NotFound(
                $"Project member with Id {userId} with association to task with Id {taskId} does not exist.");
        }

        _context.ProjectMemberTasks.Remove(targetedMember);

        int recordsChanged = _context.SaveChanges();
        Project? targetedProject = _projectService.GetProjectById(targetedTask.Milestone.ProjectId.ToString());
        recordsChanged += await _projectService.SetCurrentDateTimeToProjectLastUpdated(targetedProject!);

        if (recordsChanged > 0)
        {
            return Ok(
                $"Successfully removed association with project member with Id {userId} and task with Id {taskId}");
        }

        return new ContentResult()
        {
            StatusCode = 500,
            Content = $"Failed to remove association with project member with Id {userId} and task with Id {taskId}."
        };
    }

    [HttpPatch("{taskId}/mark-as-completed")]
    public async Task<IActionResult> MarkTaskAsCompletedById(string taskId)
    {
        ProjectTask? targetedTask = _context.ProjectTasks
            .Include(x => x.Milestone)
            .SingleOrDefault(x => x.Id == Guid.Parse(taskId));

        if (targetedTask == null)
        {
            return NotFound($"Task with Id {taskId} does not exist.");
        }

        targetedTask.IsCompleted = true;

        int recordsChanged = _context.SaveChanges();
        Project? targetedProject = _projectService.GetProjectById(targetedTask.Milestone.ProjectId.ToString());
        recordsChanged += await _projectService.SetCurrentDateTimeToProjectLastUpdated(targetedProject!);

        if (recordsChanged > 0)
        {
            return Ok(
                $"Task with Id {taskId} has been marked as completed.");
        }

        return new ContentResult()
        {
            StatusCode = 500,
            Content = $"Failed to mark task with Id {taskId} as completed."
        };
    }


    [HttpPatch("{taskId}/unmark-as-completed")]
    public async Task<IActionResult> UnmarkTaskAsCompletedById(string taskId)
    {
        ProjectTask? targetedTask = _context.ProjectTasks
            .Include(x => x.Milestone)
            .SingleOrDefault(x => x.Id == Guid.Parse(taskId));

        if (targetedTask == null)
        {
            return NotFound($"Task with Id {taskId} does not exist.");
        }

        targetedTask.IsCompleted = false;

        int recordsChanged = await _context.SaveChangesAsync();
        Project? targetedProject = _projectService.GetProjectById(targetedTask.Milestone.ProjectId.ToString());
        recordsChanged += await _projectService.SetCurrentDateTimeToProjectLastUpdated(targetedProject!);

        if (recordsChanged > 0)
        {
            return Ok(
                $"Task with Id {taskId} has been unmarked as completed.");
        }

        return new ContentResult()
        {
            StatusCode = 500,
            Content = $"Failed to unmark task with Id {taskId} as completed."
        };
    }

    [HttpGet("{taskId}/members")]
    public IActionResult GetTaskMembers(string taskId, [FromQuery] bool isAssignedToTask = true)
    {
        ProjectTask? targetedTask = _context.ProjectTasks
            .Include(x => x.Milestone)
            .SingleOrDefault(x => x.Id.ToString() == taskId);

        if (targetedTask == null)
        {
            return NotFound($"Task with Id {taskId} does not exist.");
        }

        string projectId = targetedTask.Milestone.ProjectId.ToString();

        var taskMembers = _context.ProjectMemberTasks
            .Include(x => x.ProjectMember.User)
            .Include(x => x.ProjectMember.ProjectRole)
            .Where(x => x.TaskId.ToString() == taskId);

        if (isAssignedToTask)
        {
            return Ok(taskMembers.Select(x => new
            {
                Value = x.UserId,
                Id = x.UserId,
                Email = x.ProjectMember.User.Email,
                Name = x.ProjectMember.User.FullName,
                Role = x.ProjectMember.ProjectRole.Name,
            }));
        }

        List<string> taskMembersIdList = taskMembers
            .Select(x => x.UserId.ToString())
            .ToList();

        // Returning members in the project but are not assigned to task
        var projectMembersNotAssignedToTask = _context.ProjectMembers
            .Include(x => x.User)
            .Include(x => x.ProjectRole)
            .Where(x => x.ProjectId.ToString() == projectId &&
                        !taskMembersIdList.Contains(x.UserId.ToString()))
            .Select(x => new
            {
                Value = x.UserId,
                Id = x.UserId,
                Email = x.User.Email,
                Name = x.User.FullName,
                Role = x.ProjectRole.Name
            });

        return Ok(projectMembersNotAssignedToTask);
    }
}