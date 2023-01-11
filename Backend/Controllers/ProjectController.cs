using System.ComponentModel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using PMAS_CITI.Models;
using PMAS_CITI.RequestBodies;
using PMAS_CITI.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Cors;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.SqlServer.Query.Internal;
using PMAS_CITI.Enums;
using PMAS_CITI.Jobs;
using PMAS_CITI.RequestBodies.Projects;
using PMAS_CITI.ResponseObjects;
using System.Text.Json.Serialization;


namespace PMAS_CITI.Controllers
{
    // [Authorize]
    [Route("api/projects")]
    [EnableCors("APIPolicy")]
    [ApiController]
    
    public class ProjectController : ControllerBase
    {
        private readonly ProjectService _projectService;
        private readonly UserService _userService;
        private readonly MilestoneService _milestoneService;
        private readonly NotificationService _notificationService;
        private readonly ProjectMemberService _projectMemberService;
        private readonly PMASCITIDbContext _context;

        public ProjectController(ProjectService projectService, UserService userService, PMASCITIDbContext context,
            MilestoneService milestoneService, ProjectMemberService projectMemberService,
            NotificationService notificationService)
        {
            _projectService = projectService;
            _userService = userService;
            _context = context;
            _milestoneService = milestoneService;
            _projectMemberService = projectMemberService;
            _notificationService = notificationService;
        }

        #region Project Routes

        [HttpGet("{projectId}/verify-milestones")]
        public IActionResult VerifyMilestoneProgress(string projectId)
        {
            Project? targetedProject = _projectService
                .GetProjectById(projectId);

            if (targetedProject == null)
            {
                return NotFound($"Project with Id {projectId} does not exist.");
            }

            // Checking for any incomplete milestones
            List<ProjectMilestone> incompleteMilestones =
                _milestoneService
                    .GetIncompleteMilestonesByProjectId(projectId)
                    .Select(x => new ProjectMilestone()
                    {
                        Id = x.Id,
                        Name = x.Name,
                        Description = x.Description,
                        DateProjectedStart = x.DateProjectedStart,
                        DateProjectedEnd = x.DateProjectedEnd,
                        DateActualStart = x.DateActualStart,
                        DateActualEnd = x.DateActualEnd,
                        DateUpdated = x.DateUpdated,
                        DateCreated = x.DateCreated,
                        PaymentPercentage = x.PaymentPercentage,
                        IsPaid = x.IsPaid,
                        IsCompleted = x.IsCompleted
                    })
                    .ToList();

            if (incompleteMilestones.Any())
            {
                return new ContentResult()
                {
                    StatusCode = 417,
                    Content = JsonConvert.SerializeObject(incompleteMilestones),
                    ContentType = "application/json"
                };
            }

            // Checking if the sum of milestone percentage adds up to 100
            List<ProjectMilestone> milestonesForProject = _milestoneService
                .GetMilestonesByProjectId(projectId)
                .Select(x => new ProjectMilestone()
                {
                    Id = x.Id,
                    Name = x.Name,
                    Description = x.Description,
                    DateProjectedStart = x.DateProjectedStart,
                    DateProjectedEnd = x.DateProjectedEnd,
                    DateActualStart = x.DateActualStart,
                    DateActualEnd = x.DateActualEnd,
                    DateUpdated = x.DateUpdated,
                    DateCreated = x.DateCreated,
                    PaymentPercentage = x.PaymentPercentage,
                    IsPaid = x.IsPaid,
                    IsCompleted = x.IsCompleted
                })
                .ToList();

            int totalMlestonePercentage = milestonesForProject.Sum(x => x.PaymentPercentage);
            if (totalMlestonePercentage != 100)
            {
                return new ContentResult()
                {
                    StatusCode = 412,
                    Content = JsonConvert.SerializeObject(milestonesForProject),
                    ContentType = "application/json"
                };
            }

            return Ok();
        }

        [HttpGet("{projectId}/project-lead")]
        public IActionResult GetProjectLead(string projectId)
        {
            Project? targetedProject = _projectService.GetProjectById(projectId);

            if (targetedProject == null)
            {
                return NotFound($"Project with Id {projectId} does not exist.");
            }

            ProjectMember? projectLead = _projectService.GetProjectLeadForProject(projectId);

            if (projectLead == null)
            {
                return Ok(null);
            }

            return Ok(new
            {
                Id = projectLead.User.Id,
                Email = projectLead.User.Email,
                Name = projectLead.User.FullName,
            });
        }

        [HttpGet("{projectId}/creator")]
        public IActionResult GetProjectCreator(string projectId)
        {
            Project? targetedProject = _projectService.GetProjectById(projectId);

            if (targetedProject == null)
            {
                return NotFound($"Project with Id {projectId} does not exist.");
            }

            ProjectMember? projectCreator = _projectService.GetProjectCreatorForProject(projectId);

            if (projectCreator == null)
            {
                return Ok(null);
            }

            return Ok(new
            {
                Id = projectCreator.User.Id,
                Email = projectCreator.User.Email,
                Name = projectCreator.User.FullName,
            });
        }

        [HttpPatch("{projectId}/mark-as-completed")]
        public async Task<IActionResult> MarkProjectAsCompletedById(string projectId)
        {
            Project? targetedProject = _projectService.GetProjectById(projectId);

            if (targetedProject == null)
            {
                return NotFound($"Project with Id {projectId} does not exist.");
            }

            // Checking for any incomplete milestones
            List<ProjectMilestone> incompleteMilestones =
                _milestoneService.GetIncompleteMilestonesByProjectId(projectId);

            if (incompleteMilestones.Any())
            {
                return new ContentResult()
                {
                    StatusCode = 417,
                    Content = JsonConvert.SerializeObject(incompleteMilestones),
                    ContentType = "application/json"
                };
            }

            // Checking if the sum of milestone percentage adds up to 100
            List<ProjectMilestone> milestonesForProject = _milestoneService.GetMilestonesByProjectId(projectId);

            int totalMilestonePercentage = milestonesForProject.Sum(x => x.PaymentPercentage);
            if (totalMilestonePercentage != 100)
            {
                return new ContentResult()
                {
                    StatusCode = 417,
                    Content = JsonConvert.SerializeObject(milestonesForProject),
                    ContentType = "application/json"
                };
            }

            targetedProject.IsCompleted = true;
            targetedProject.DateActualEnd = DateTime.Now;

            int recordsChanged = _context.SaveChanges();
            recordsChanged += await _projectService.SetCurrentDateTimeToProjectLastUpdated(targetedProject);

            if (recordsChanged > 0)
            {
                return Ok($"Project with Id {projectId} has been marked as completed.");
            }

            return new ContentResult()
            {
                StatusCode = 500,
                Content = $"Failed to mark project with Id {projectId} as compeleted"
            };
        }


        [HttpPatch("{projectId}/mark-as-paid")]
        public async Task<IActionResult> MarkProjectAsPaidById(string projectId)
        {
            Project? targetedProject = _projectService.GetProjectById(projectId);

            if (targetedProject == null)
            {
                return NotFound($"Project with Id {projectId} does not exist.");
            }

            // Checking if the sum of milestone percentage adds up to 100
            List<ProjectMilestone> milestonesForProject = _milestoneService.GetMilestonesByProjectId(projectId);

            int totalMilestonePercentage = milestonesForProject.Sum(x => x.PaymentPercentage);
            if (totalMilestonePercentage != 100)
            {
                return new ContentResult()
                {
                    StatusCode = 417,
                    Content = JsonConvert.SerializeObject(milestonesForProject),
                    ContentType = "application/json"
                };
            }

            targetedProject.IsPaid = true;
            targetedProject.DatePaid = DateTime.Now;

            int recordsChanged = _context.SaveChanges();

            if (recordsChanged > 0)
            {
                return Ok($"Project with Id {projectId} has been marked as paid.");
            }

            return new ContentResult()
            {
                StatusCode = 500,
                Content = $"Failed to mark project with Id {projectId} as paid."
            };
        }

        [HttpGet("{projectId}/payment-information")]
        public IActionResult GetProjectPaymentInformation(string projectId)
        {
            Project? targetedProject = _projectService.GetProjectById(projectId);

            if (targetedProject == null)
            {
                return NotFound($"Project with Id {projectId} does not exist.");
            }

            return Ok(_projectService.GetPaymentInformation(targetedProject));
        }

        [HttpGet("{projectId}/milestones")]
        public IActionResult GetMilestonesForProject(string projectId)
        {
            Project? targetedProject = _projectService.GetProjectById(projectId);

            if (targetedProject == null)
            {
                return NotFound($"Project with Id {projectId} does not exist.");
            }

            return Ok(_context.ProjectMilestones
                .Where(x => x.ProjectId == targetedProject.Id)
                .Select(x => new ProjectMilestone()
                {
                    Id = x.Id,
                    Name = x.Name,
                    Description = x.Description,
                    DateProjectedStart = x.DateProjectedStart,
                    DateProjectedEnd = x.DateProjectedEnd,
                    DateActualStart = x.DateActualStart,
                    DateActualEnd = x.DateActualEnd,
                    DateUpdated = x.DateUpdated,
                    DateCreated = x.DateCreated,
                    DatePaid = x.DatePaid,
                    PaymentPercentage = x.PaymentPercentage,
                    IsCompleted = x.IsCompleted,
                    IsPaid = x.IsPaid
                })
            );
        }

        [HttpPost]
        public async Task<IActionResult> InsertProject([FromBody] NewProjectForm newProjectForm)
        {
            ClaimsIdentity? currentIdentity = HttpContext.User.Identity as ClaimsIdentity;
            string userId = currentIdentity.FindFirst("user_id").Value;

            User currentUser = _userService.GetUserById(userId);

            if (currentUser == null)
            {
                return Unauthorized();
            }

            Guid projectId = Guid.NewGuid();
            int recordsChanged = 0;

            Project newProject = new Project()
            {
                Id = projectId,
                Name = newProjectForm.Name,
                Description = newProjectForm.Description,
                DateProjectedStart = newProjectForm.DateProjectedStart,
                DateProjectedEnd = newProjectForm.DateProjectedEnd,
                DateActualStart = newProjectForm.DateActualStart,
                DateActualEnd = newProjectForm.DateActualEnd,
                PaymentAmount = newProjectForm.PaymentAmount,
                DateCreated = DateTime.Now,
                DateUpdated = DateTime.Now,
                CreatedyById = currentUser.Id,
                AzureProjectId = newProjectForm.AzureProjectId
            };

            recordsChanged += _projectService.InsertProject(newProject);

            ProjectMember projectCreator = new ProjectMember()
            {
                User = currentUser,
                ProjectId = projectId,
                ProjectRoleId = Guid.Parse("00000000000000000000000000000002"),
                DateJoined = DateTime.Now
            };

            recordsChanged += _projectMemberService.InsertProjectMember(projectCreator);
            recordsChanged += await _projectService.SetCurrentDateTimeToProjectLastUpdated(newProject);
            _projectService.QueueNotificationForProjectOverdue(newProject);

            if (recordsChanged > 0)
            {
                return Ok();
            }

            return StatusCode(500);
        }

        [HttpGet("{projectId}")]
        public IActionResult GetProjectById(string projectId)
        {
            // TODO: Check user permissions before returning project
            Project? targetedProject = _projectService.GetProjectById(projectId);

            if (targetedProject == null)
            {
                return NotFound();
            }

            return Ok(targetedProject);
        }

        [HttpGet("{projectId}/status")]
        public IActionResult GetProjectStatus(string projectId)
        {
            Project? targetedProject = _projectService.GetProjectById(projectId);

            if (targetedProject == null)
            {
                return NotFound($"Project with Id {projectId} does not exist.");
            }

            ProjectStatus? projectStatus = _projectService.GetProjectStatus(targetedProject.Id.ToString());

            if (projectStatus == null)
            {
                return Ok(nameof(ProjectStatus.ONGOING));
            }

            return Ok(projectStatus.Value.ToString());
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProject([FromBody] UpdateProjectForm updateProjectForm)
        {
            Project? targetedProject = _projectService.GetProjectById(updateProjectForm.Id);

            if (targetedProject == null)
            {
                return NotFound($"Project with Id {updateProjectForm.Id} does not exist.");
            }

            targetedProject.Name = updateProjectForm.Name;
            targetedProject.Description = updateProjectForm.Description;
            targetedProject.DateProjectedStart = updateProjectForm.DateProjectedStart;
            targetedProject.DateProjectedEnd = updateProjectForm.DateProjectedEnd;
            targetedProject.DateActualStart = updateProjectForm.DateActualStart;
            targetedProject.DateActualEnd = updateProjectForm.DateActualEnd;
            targetedProject.PaymentAmount = updateProjectForm.PaymentAmount;
            targetedProject.DateUpdated = DateTime.Now;
            targetedProject.AzureProjectId = updateProjectForm.AzureProjectId;

            int recordsChanged = _context.SaveChanges();

            recordsChanged += await _projectService.SetCurrentDateTimeToProjectLastUpdated(targetedProject);
            _projectService.QueueNotificationForProjectOverdue(targetedProject);

            if (recordsChanged > 0)
            {
                return Ok($"Project with Id {updateProjectForm.Id} details has been successfully updated.");
            }

            return new ContentResult()
            {
                StatusCode = 500,
                Content = $"Failed to update project with Id {updateProjectForm.Id}."
            };
        }

        // TODO: Delete job for projects and milestones
        [HttpDelete("{projectId}")]
        public async Task<IActionResult> DeleteProjectById(string projectId)
        {
            Project? targetedProject = _projectService.GetProjectById(projectId);

            if (targetedProject == null)
            {
                return NotFound($"Project with Id {projectId} does not exist.");
            }

            await _notificationService.RemoveAllNotificationsForProject(targetedProject);
            int recordsChanged = _projectService.DeleteProject(targetedProject);

            if (recordsChanged > 0)
            {
                return Ok($"Project with Id {projectId} have been successfully deleted.");
            }

            return new ContentResult()
            {
                StatusCode = 500,
                Content = $"Failed to delete project with Id {projectId}."
            };
        }

        [HttpGet("{projectId}/progress")]
        public IActionResult GetProjectProgress(string projectId)
        {
            Project? targetedProject = _projectService.GetProjectById(projectId);
            if (targetedProject == null)
            {
                return NotFound($"Project with Id {projectId} does not exist.");
            }

            double totalMilestoneCount = _context.ProjectMilestones.Count(x => x.ProjectId.ToString() == projectId);
            double completedMilestoneCount =
                _context.ProjectMilestones.Count(x => x.ProjectId.ToString() == projectId && x.IsCompleted);

            if (totalMilestoneCount == 0)
            {
                return Ok(0);
            }

            return Ok((completedMilestoneCount / totalMilestoneCount) * 100);
        }

        #endregion

        #region Project Member Routes

        [HttpGet("roles")]
        public IActionResult GetProjectRoles()
        {
            return Ok(_context.ProjectRoles
                .Where(pr => pr.Name != "Creator")
                .Select(pr => new
                {
                    Id = pr.Id,
                    Name = pr.Name
                })
                .ToList());
        }

        [HttpGet("{projectId}/members")]
        public IActionResult GetProjectMembers(string projectId)
        {
            Project? targetedProject = _context.Projects.SingleOrDefault(x => x.Id.ToString() == projectId);
            if (targetedProject == null)
            {
                return NotFound($"Project with Id {projectId} does not exist.");
            }

            return Ok(_context.ProjectMembers
                .Include(pm => pm.User)
                .Include(p => p.ProjectRole)
                .Where(pm => pm.ProjectId.ToString() == projectId)
                .Select(m => new
                {
                    Value = m.User.Id,
                    UserId = m.User.Id,
                    Name = m.User.FullName,
                    Email = m.User.Email,
                    Role = m.ProjectRole.Name,
                    DateJoined = m.DateJoined
                })
                .ToList());
        }

        [HttpPost("{projectId}/members/search")]
        public IActionResult SearchProjectMembers(string projectId, [FromBody] MembersSearchParameters searchParameters)
        {
            if (searchParameters.IsProjectMember)
            {
                return Ok(_context.ProjectMembers
                    .Include(pm => pm.User)
                    .Include(p => p.ProjectRole)
                    .Where(pm => pm.ProjectId.ToString() == projectId &&
                                 (pm.User.FullName.Contains(searchParameters.Query) ||
                                  pm.User.Email.Contains(searchParameters.Query))
                    )
                    .Skip(searchParameters.ResultsSize * searchParameters.ResultsPage)
                    .Take(searchParameters.ResultsSize)
                    .Select(m => new
                    {
                        Value = m.User.Id,
                        UserId = m.User.Id,
                        Name = m.User.FullName,
                        Email = m.User.Email,
                        Role = m.ProjectRole.Name,
                        DateJoined = m.DateJoined
                    })
                    .ToList());
            }

            List<String> projectMembers = _context.ProjectMembers
                .Where(pm => pm.ProjectId.ToString() == projectId)
                .Select(s => s.UserId.ToString())
                .ToList();

            var usersNotInProject = _context.Users
                .Where(u => !projectMembers.Contains(u.Id.ToString()) &&
                            !searchParameters.UserIdListToExclude.Contains(u.Id.ToString()) &&
                            (u.Email.Contains(searchParameters.Query) ||
                             u.FullName.Contains(searchParameters.Query))
                )
                .Skip(searchParameters.ResultsSize * searchParameters.ResultsPage)
                .Take(searchParameters.ResultsSize)
                .Select(u => new
                {
                    Value = u.Id,
                    Name = u.FullName,
                    Email = u.Email,
                })
                .ToList();

            return Ok(usersNotInProject);
        }

        // TODO: Proper handling for null projects or null users
        // TODO: Also check if the user has already been added to the project
        [HttpPost("{projectId}/members")]
        public IActionResult AddMembersToProject([FromBody] NewProjectMemberForm newProjectMembers, string projectId)
        {
            foreach (string userId in newProjectMembers.UserIdList)
            {
                _context.ProjectMembers.Add(new ProjectMember()
                {
                    ProjectId = Guid.Parse(projectId),
                    UserId = Guid.Parse(userId),
                    ProjectRoleId = Guid.Parse(newProjectMembers.ProjectRoleId),
                    DateJoined = DateTime.Now
                });
            }

            int recordsChanged = _context.SaveChanges();

            if (recordsChanged > 0)
            {
                return Ok($"Users have been added to project with Id {projectId}.");
            }

            return new ContentResult()
            {
                StatusCode = 500,
                Content = $"Failed to add users to project with Id {projectId}."
            };
        }

        [HttpDelete("{projectId}/members/{userId}")]
        public IActionResult RemoveMembersFromProject(string projectId, string userId)
        {
            ProjectMember? targetedMember = _context.ProjectMembers
                .Include(x => x.ProjectRole)
                .SingleOrDefault(x =>
                    x.ProjectId.ToString() == projectId && x.UserId.ToString() == userId);

            if (targetedMember == null)
            {
                return NotFound($"Project member with Id {userId} not found under project with Id {projectId}.");
            }

            if (targetedMember.ProjectRole.Name == "Creator")
            {
                return Forbid("Project creator cannot be removed from the project.");
            }

            _context.ProjectMembers.Remove(targetedMember);

            int recordsChanged = _context.SaveChanges();

            if (recordsChanged > 0)
            {
                return Ok($"Project member with Id {userId} was removed from project with Id {projectId}.");
            }

            return new ContentResult()
            {
                StatusCode = 500,
                Content = $"Failed to remove project member with Id {userId} from project with Id {projectId}."
            };
        }

        #endregion

        [HttpPatch("{projectId}/members/update-role")]
        public async Task<IActionResult> UpdateProjectMemberRole([FromBody] UpdateProjectMemberRoleForm payload)
        {
            Project? targetedProject = _projectService.GetProjectById(payload.ProjectId);

            if (targetedProject == null)
            {
                return NotFound($"Project with Id {payload.ProjectId} does not exist.");
            }

            ProjectMember? targetedProjectMember = _context.ProjectMembers
                .SingleOrDefault(x => x.UserId == Guid.Parse(payload.MemberId) &&
                                      x.ProjectId == Guid.Parse(payload.ProjectId));

            if (targetedProjectMember == null)
            {
                return NotFound(
                    $"Project member with Id {payload.MemberId} under project with Id {payload.ProjectId} does not exist.");
            }

            ProjectRole? targetedProjectRole = _context.ProjectRoles
                .SingleOrDefault(x => x.Id == Guid.Parse(payload.RoleId));

            ProjectRole developerRole = _context.ProjectRoles.SingleOrDefault(x => x.Name == "Developer");

            if (targetedProjectRole == null)
            {
                return NotFound($"Project role with {payload.RoleId} is does not exist.");
            }

            var projectMembers = _context.ProjectMembers
                .Where(x => x.ProjectId == Guid.Parse(payload.ProjectId));

            if (targetedProjectRole.Name == "Project Lead")
            {
                foreach (ProjectMember member in projectMembers)
                {
                    if (member.ProjectRoleId == targetedProjectRole.Id)
                    {
                        member.ProjectRoleId = developerRole.Id;
                    }
                }
            }

            targetedProjectMember.ProjectRoleId = targetedProjectRole.Id;
            int recordsChanged = _context.SaveChanges();
            recordsChanged += await _projectService.SetCurrentDateTimeToProjectLastUpdated(targetedProject);

            if (recordsChanged > 0)
            {
                return Ok();
            }

            return new ContentResult()
            {
                StatusCode = 500,
                Content =
                    $"Unable to update member with Id {payload.MemberId} belonging to project with Id {payload.ProjectId} to {targetedProjectRole.Name}"
            };
        }

        [HttpGet("{projectId}/members/count")]
        public IActionResult GetProjectMemberCount(string projectId)
        {
            Project? targetedProject = _projectService.GetProjectById(projectId);

            if (targetedProject == null)
            {
                return NotFound($"Project with Id {projectId} does not exist.");
            }

            return Ok(_context.ProjectMembers.Count(x => x.ProjectId == targetedProject.Id));
        }
        
        [HttpGet("{projectId}/milestones/count")]
        public IActionResult GetProjectMilestonesCount(string projectId)
        {
            Project? targetedProject = _projectService.GetProjectById(projectId);

            if (targetedProject == null)
            {
                return NotFound($"Project with Id {projectId} does not exist.");
            }

            return Ok(_context.ProjectMilestones.Count(x => x.ProjectId == targetedProject.Id));
        }

        [HttpGet("{projectId}/documents/count")]
        public IActionResult GetProjectDocumentsCount(string projectId)
        {
            Project? targetedProject = _projectService.GetProjectById(projectId);

            if (targetedProject == null)
            {
                return NotFound($"Project with Id {projectId} does not exist.");
            }

            return Ok(_context.ProjectDocuments.Count(x => x.ProjectId == targetedProject.Id));
        }

        [HttpGet("{projectId}/risks/count")]
        public IActionResult GetProjectRisksCount(string projectId)
        {
            Project? targetedProject = _projectService.GetProjectById(projectId);

            if (targetedProject == null)
            {
                return NotFound($"Project with Id {projectId} does not exist.");
            }

            return Ok(_context.ProjectRisks.Count(x => x.ProjectId == targetedProject.Id));
        }

        [HttpPost("search/advanced")]
        public IActionResult AdvancedSearch([FromBody] SearchQuery searchQuery)
        {
            ClaimsIdentity? currentIdentity = HttpContext.User.Identity as ClaimsIdentity;
            string userId = currentIdentity.FindFirst("user_id").Value;

            User? currentUser = _userService.GetUserById(userId);

            if (currentUser == null)
            {
                return Unauthorized();
            }

            ProjectStatusWithAll projectStatus;
            Enum.TryParse(searchQuery.ProjectStatus, out projectStatus);

            ProjectScope projectScope;
            Enum.TryParse(searchQuery.ProjectScope, out projectScope);

            ProjectSort sort;
            Enum.TryParse(searchQuery.Sort, out sort);

            List<Guid> projectIdFromLead = new List<Guid>();

            if (currentUser.PlatformRoleId == Guid.Parse("00000000-0000-0000-0000-000000000002"))
            {
                projectIdFromLead = _context.ProjectMembers
                    .Include(x => x.Project)
                    .Where(x => x.UserId == currentUser.Id &&
                                x.ProjectRoleId == Guid.Parse("2da38cd6-e49d-446f-871b-3fbd443198b6"))
                    .Select(x => x.Project.Id)
                    .Distinct()
                    .ToList();
            }

            List<Project> genericQuery = _context.ProjectMembers
                .AsNoTracking()
                .Include(x => x.Project)
                .Include(x => x.User)
                .Where(x =>
                    (x.Project.Name.Contains(searchQuery.GenericQuery) ||
                     x.Project.Description.Contains(searchQuery.GenericQuery) ||
                     x.User.FullName.Contains(searchQuery.GenericQuery) ||
                     x.User.Email.Contains(searchQuery.GenericQuery)) &&
                    (!projectIdFromLead.Any() || projectIdFromLead.Contains(x.ProjectId)) &&
                    (!searchQuery.DateProjectedStart.HasValue ||
                     x.Project.DateProjectedStart >= searchQuery.DateProjectedStart.Value) &&
                    (!searchQuery.DateProjectedEnd.HasValue ||
                     x.Project.DateProjectedEnd <= searchQuery.DateProjectedEnd.Value) &&
                    (!searchQuery.UserIdList.Any() || searchQuery.UserIdList.Contains(x.UserId.ToString())) &&
                    x.ProjectRoleId.ToString().Contains(searchQuery.UserRoleId))
                .Select(x => new Project()
                {
                    Id = x.Project.Id,
                    Name = x.Project.Name,
                    Description = x.Project.Description,
                    DateProjectedStart = x.Project.DateProjectedStart,
                    DateProjectedEnd = x.Project.DateProjectedEnd,
                    DateActualStart = x.Project.DateActualStart,
                    DateActualEnd = x.Project.DateActualEnd,
                    DateCreated = x.Project.DateCreated,
                    DateUpdated = x.Project.DateUpdated,
                    IsCompleted = x.Project.IsCompleted,
                    CreatedyById = x.Project.CreatedyById
                })
                .Distinct()
                .ToList();

            switch (projectScope)
            {
                case ProjectScope.ALL:
                    break;

                case ProjectScope.CREATED_BY_YOU:
                    genericQuery = genericQuery
                        .Where(x => x.CreatedyById == currentUser.Id)
                        .ToList();
                    break;
            }

            if (projectStatus != ProjectStatusWithAll.ALL)
            {
                genericQuery = genericQuery
                    .Where(x => 1 + (int) _projectService.GetProjectStatus(x.Id.ToString()) == (int) projectStatus)
                    .Distinct()
                    .ToList();
            }
            else
            {
                genericQuery = genericQuery
                    .Distinct()
                    .ToList();
            }

            switch (sort)
            {
                case ProjectSort.DATE_CREATED_ASC:
                    genericQuery = genericQuery
                        .OrderBy(x => x.DateCreated)
                        .ToList();
                    break;

                case ProjectSort.DATE_CREATED_DESC:
                    genericQuery = genericQuery
                        .OrderByDescending(x => x.DateCreated)
                        .ToList();
                    break;

                case ProjectSort.DATE_UPDATED_ASC:
                    genericQuery = genericQuery
                        .OrderBy(x => x.DateUpdated)
                        .ToList();
                    break;

                case ProjectSort.DATE_UPDATED_DESC:
                    genericQuery = genericQuery
                        .OrderByDescending(x => x.DateUpdated)
                        .ToList();
                    break;

                case ProjectSort.DATE_PROJECTED_START_ASC:
                    genericQuery = genericQuery
                        .OrderBy(x => x.DateProjectedStart)
                        .ToList();
                    break;

                case ProjectSort.DATE_PROJECTED_START_DESC:
                    genericQuery = genericQuery
                        .OrderByDescending(x => x.DateProjectedStart)
                        .ToList();
                    break;

                case ProjectSort.DATE_PROJECTED_END_ASC:
                    genericQuery = genericQuery
                        .OrderBy(x => x.DateProjectedEnd)
                        .ToList();
                    break;

                case ProjectSort.DATE_PROJECTED_END_DESC:
                    genericQuery = genericQuery
                        .OrderByDescending(x => x.DateProjectedEnd)
                        .ToList();
                    break;
            }
            return Ok(genericQuery);
        }


        [HttpGet("{projectId}/chart_data")]
        public IActionResult GetChartData(string projectId, string milestoneId)
        {
            return Ok(_projectService.GetChartData(projectId, milestoneId));
        }

        [HttpGet("{projectId}/all_chart_data")]
        public IActionResult GetAllChartData(string projectId)
        {
            return Ok(_projectService.GetAllChartData(projectId));
        }
        
    }
    public class ChartDataObject
    {
        public List<string> Labels { get; set; } = new List<string>();
        public List<int> Data { get; set; } = new List<int>();
    }
}

