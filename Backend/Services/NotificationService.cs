using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PMAS_CITI.Jobs;
using PMAS_CITI.Models;
using PMAS_CITI.QuartzConfig;
using PMAS_CITI.SignalRConfig;
using PMAS_CITI.Utils;
using Quartz;

namespace PMAS_CITI.Services;

public class NotificationService
{
    // Types of notifications:
    // Milestone completion overdue: Check if milestone is marked as completed after the date projected end
    // Milestone payment overdue: Check if milestone has been marked as paid after an arbitrary amount of time after it has been marked completed 
    // Project completion overdue: Check if milestone has been marked completed after the date projected end
    // Project not updated in a while: Check if project has been updated after an arbitrary amount of time

    private readonly PMASCITIDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly Scheduler _scheduler;
    private readonly IConfiguration _configuration;

    public NotificationService(PMASCITIDbContext context, Scheduler scheduler, IHubContext<NotificationHub> hubContext,
        IConfiguration configuration)
    {
        _context = context;
        _scheduler = scheduler;
        _hubContext = hubContext;
        _configuration = configuration;
    }

    public int InsertNotification(Notification notification)
    {
        _context.Notifications.Add(notification);
        return _context.SaveChanges();
    }

    public List<NotificationLog> GetNotificationsForUser(string userId)
    {
        List<NotificationLog> notificationLogs = _context.NotificationLogs
            .AsNoTracking()
            .Include(x => x.Notification.NotificationCategory)
            .Include(x => x.Notification.Project)
            .Include(x => x.Notification.Milestone)
            .Include(x => x.Notification)
            .Where(x => x.UserId == Guid.Parse(userId))
            .ToList();

        return notificationLogs;
    }

    public Task<bool> CheckJobExist(string name, string group)
    {
        return _scheduler.CheckExists(name, group);
    }

    public List<NotificationCategory> GetAllNotificationCategories()
    {
        return _context.NotificationCategories
            .ToList();
    }

    public NotificationCategory? GetNotificationCategoryById(string id)
    {
        return _context.NotificationCategories
            .SingleOrDefault(x => x.Id == Guid.Parse(id));
    }

    public IJobDetail? BuildNotificationJobForProject(string projectId, string notificationTypeId)
    {
        NotificationCategory? targetedNotificationCategory = GetNotificationCategoryById(notificationTypeId);

        if (targetedNotificationCategory == null)
        {
            return null;
        }

        var job = JobBuilder.Create<NotifyJob>()
            .UsingJobData("projectId", projectId)
            .UsingJobData("milestoneId", null)
            .UsingJobData("notificationTypeId", notificationTypeId)
            .WithIdentity(projectId, notificationTypeId)
            .Build();

        return job;
    }

    public int InsertNotificationLog(NotificationLog notificationLog)
    {
        _context.NotificationLogs.Add(notificationLog);
        return _context.SaveChanges();
    }

    public IJobDetail? BuildNotificationJobForMilestone(string projectId, string milestoneId, string notificationTypeId)
    {
        NotificationCategory? targetedNotificationCategory = GetNotificationCategoryById(notificationTypeId);

        if (targetedNotificationCategory == null) return null;

        IJobDetail job = JobBuilder.Create<NotifyJob>()
            .UsingJobData("projectId", projectId)
            .UsingJobData("milestoneId", milestoneId)
            .UsingJobData("notificationTypeId", notificationTypeId)
            .WithIdentity(milestoneId, notificationTypeId)
            .Build();

        return job;
    }

    // TODO: Improvement: Parse the categories as a List and programmatically remove each notification category job instead of hardcoding it.
    /// <summary>
    /// Removal of notifications from the project as a whole, this covers notifications originating from the project and its milestones.
    /// The awaiting of these methods is to make sure that the jobs are deleted before the project is removed from the database itself.
    /// Only call this function before removal of project from the database
    /// </summary>
    /// <param name="targetedProject">The project that is going to be deleted.</param>
    public async Task RemoveAllNotificationsForProject(Project targetedProject)
    {
        string projectId = targetedProject.Id.ToString();

        string projectCompletionOverdue =
            StringFormatting.FormatStringAsGuid(
                _configuration["Notifications:Categories:Project completion overdue.:Id"]);

        string projectNotUpdated =
            StringFormatting.FormatStringAsGuid(
                _configuration["Notifications:Categories:Project not updated recently.:Id"]);

        // Removal of notifications originating from project
        await _scheduler.Delete(projectId, projectCompletionOverdue);
        await _scheduler.Delete(projectId, projectNotUpdated);

        // Removal of notifications originating from project's milestones
        List<ProjectMilestone> projectMilestones = _context.ProjectMilestones
            .Where(x => x.ProjectId == targetedProject.Id)
            .ToList();

        foreach (ProjectMilestone milestone in projectMilestones)
        {
            await RemoveAllNotificationsForMilestone(milestone);
        }
    }

    public async Task RemoveAllNotificationsForMilestone(ProjectMilestone targetedMilestone)
    {
        string milestoneCompletionOverdue =
            StringFormatting.FormatStringAsGuid(
                _configuration["Notifications:Categories:Milestone payment overdue.:Id"]);

        string milestonePaymentOverdue =
            StringFormatting.FormatStringAsGuid(
                _configuration["Notifications:Categories:Milestone completion overdue.:Id"]);

        await _scheduler.Delete(targetedMilestone.Id.ToString("D"), milestoneCompletionOverdue);
        await _scheduler.Delete(targetedMilestone.Id.ToString("D"), milestonePaymentOverdue);
    }

    public bool CheckIfProjectHasCompletionOverdue(Project targetedProject)
    {
        return !targetedProject.IsCompleted && DateTime.Now > targetedProject.DateProjectedEnd;
    }

    public bool CheckIfMilestoneHasCompletionOverdue(ProjectMilestone targetedMilestone)
    {
        return !targetedMilestone.IsCompleted && DateTime.Now > targetedMilestone.DateProjectedEnd;
    }

    public bool CheckIfMilestoneHasPaymentOverdue(ProjectMilestone targetedMilestone)
    {
        return targetedMilestone.IsCompleted &&
               !targetedMilestone.IsPaid &&
               targetedMilestone.DateActualEnd != null &&
               DateTime.Now > targetedMilestone.DateActualEnd.Value.AddSeconds(10);
    }

    public void NotifyUsers(JobDataMap jobDataMap)
    {
        string projectId = (string)jobDataMap["projectId"];
        string? milestoneId = (string?)jobDataMap["milestoneId"];
        string notificationTypeId = (string)jobDataMap["notificationTypeId"];

        NotificationCategory? targetedNotificationCategory = GetNotificationCategoryById(notificationTypeId);

        if (targetedNotificationCategory == null)
        {
            return;
        }

        Project? targetedProject = _context.Projects
            .SingleOrDefault(x => x.Id == Guid.Parse(projectId));

        if (targetedProject == null)
        {
            return;
        }

        ProjectMilestone? targetedMilestone = null;

        if (milestoneId != null)
        {
            targetedMilestone = _context.ProjectMilestones
                .SingleOrDefault(x => x.Id == Guid.Parse(milestoneId));
        }

        // Retrieving the Project Leads and Managers for the project.
        ProjectRole? creatorRole = _context.ProjectRoles
            .SingleOrDefault(x => x.Name == "Creator");

        ProjectRole? leadRole = _context.ProjectRoles
            .SingleOrDefault(x => x.Name == "Project Lead");

        ProjectMember? projectCreator = _context.ProjectMembers
            .Include(x => x.User)
            .SingleOrDefault(x => x.ProjectRoleId == creatorRole.Id &&
                                  x.ProjectId == targetedProject.Id);

        ProjectMember? projectLead = _context.ProjectMembers
            .Include(x => x.User)
            .FirstOrDefault(x => x.ProjectRoleId == leadRole.Id &&
                                  x.ProjectId == targetedProject.Id);

        // Checking which notification it is. 
        string projectCompletionOverdue =
            StringFormatting.FormatStringAsGuid(
                _configuration["Notifications:Categories:Project completion overdue.:Id"]);

        string projectNotUpdated =
            StringFormatting.FormatStringAsGuid(
                _configuration["Notifications:Categories:Project not updated recently.:Id"]);

        string milestoneCompletionOverdue =
            StringFormatting.FormatStringAsGuid(
                _configuration["Notifications:Categories:Milestone completion overdue.:Id"]);

        string milestonePaymentOverdue =
            StringFormatting.FormatStringAsGuid(
                _configuration["Notifications:Categories:Milestone payment overdue.:Id"]);

        // Extra checks to make sure that notification is sent out correctly
        if (targetedNotificationCategory.Id.ToString("D") == projectCompletionOverdue)
        {
            // Exits notification if project's completion is not overdue.
            if (!CheckIfProjectHasCompletionOverdue(targetedProject))
            {
                return;
            }
        }

        if (targetedNotificationCategory.Id.ToString("D") == milestoneCompletionOverdue)
        {
            // Exits notification if milestone's completion is not overdue.
            if (!CheckIfMilestoneHasCompletionOverdue(targetedMilestone!))
            {
                return;
            }
        }

        if (targetedNotificationCategory.Id.ToString("D") == milestonePaymentOverdue)
        {
            // Exits notification if milestone's payment is not overdue.
            if (!CheckIfMilestoneHasPaymentOverdue(targetedMilestone!))
            {
                return;
            }
        }

        Console.WriteLine("Sending notification to user.");

        DateTime currentDateTime = DateTime.Now;
        
        // Inserting the notification 
        Notification notification = new Notification()
        {
            Id = Guid.NewGuid(),
            Project = targetedProject,
            Milestone = targetedMilestone,
            NotificationCategory = targetedNotificationCategory,
            DateCreated = currentDateTime
        };


        // Inserting logs for each user
        NotificationLog notificationLogForCreator = new NotificationLog()
        {
            Notification = notification,
            User = projectCreator.User,
            IsSeen = false,
            DateCreated = currentDateTime
        };

        NotificationLog? notificationLogForLead = null;

        if (projectLead != null)
        {
            notificationLogForLead = new NotificationLog()
            {
                Notification = notification,
                User = projectLead.User,
                IsSeen = false,
                DateCreated = currentDateTime
            };
        }

        int recordsChanged = InsertNotification(notification) +
                             InsertNotificationLog(notificationLogForCreator);

        if (notificationLogForLead != null)
        {
            recordsChanged += InsertNotificationLog(notificationLogForLead);
        }

        if (recordsChanged == 0)
        {
            return;
        }

        _hubContext.Clients
            .Users(new List<string>()
            {
                projectCreator.UserId.ToString(),
                projectLead?.UserId.ToString() ?? ""
            })
            .SendAsync("NewNotification", new UserNotification
            {
                Id = notification.Id.ToString("D"),
                ProjectId = targetedProject.Id.ToString(),
                ProjectName = targetedProject.Name,
                MilestoneId = targetedMilestone?.Id.ToString("D"),
                MilestoneName = targetedMilestone?.Name,
                Message = targetedNotificationCategory.Message,
                DateCreated = currentDateTime,
                IsSeen = false
            });
    }


    public void QueueJob(IJobDetail job, ITrigger trigger)
    {
        _scheduler.Start(job, trigger);
    }

    public async void DeleteJob(string originId, string notificationType)
    {
        await _scheduler.Delete(originId, notificationType);
    }
}