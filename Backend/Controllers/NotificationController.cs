using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using PMAS_CITI.Enums;
using PMAS_CITI.Jobs;
using PMAS_CITI.Models;
using PMAS_CITI.QuartzConfig;
using PMAS_CITI.RequestBodies.Notifications;
using PMAS_CITI.SendGridConfig;
using PMAS_CITI.Services;
using PMAS_CITI.SignalRConfig;
using PMAS_CITI.Utils;
using Quartz;

namespace PMAS_CITI.Controllers;

[Route("api/notifications")]
[ApiController]
[EnableCors("APIPolicy")]
public class NotificationController : ControllerBase
{
    private readonly NotificationService _notificationService;
    private readonly UserService _userService;
    private readonly MailSender _mailSender;
    private readonly PMASCITIDbContext _context;

    public NotificationController(NotificationService notificationService, UserService userService,
        MailSender mailSender, PMASCITIDbContext context)
    {
        _notificationService = notificationService;
        _userService = userService;
        _mailSender = mailSender;
        _context = context;
    }

    [HttpGet]
    public IActionResult TestJob()
    {
        IJobDetail? job = _notificationService.BuildNotificationJobForProject(
            "81CF24A7-43DC-4793-BC52-44E465524680",
            "00000000000000000000000000000014"
        );

        if (job == null)
        {
            //TESTING should be return Problem()
            return Problem();
        }

        ITrigger trigger =
            Trigger.BuildSeconds("81CF24A7-43DC-4793-BC52-44E465524680", "00000000000000000000000000000014", 3);

        _notificationService.QueueJob(job, trigger);
        return Ok();
    }

    [HttpGet("test")]
    public IActionResult Hehexd()
    {
        _notificationService.RemoveAllNotificationsForProject(new Project());
        return Ok();
    }

    [HttpGet("user/{userId}")]
    public IActionResult GetNotificationsForUser(string userId)
    {
        User? targetedUser = _userService.GetUserById(userId);

        if (targetedUser == null)
        {
            return NotFound($"User with Id {userId} does not exist.");
        }

        List<NotificationLog> notificationLogs = _notificationService.GetNotificationsForUser(userId);

        var notifications =
            notificationLogs
                .OrderByDescending(x => x.DateCreated)
                .Take(5)
                .Select(x => new
                {
                    Id = x.NotificationId.ToString("D"),
                    ProjectId = x.Notification.ProjectId.ToString(),
                    ProjectName = x.Notification.Project.Name,
                    MilestoneId = x.Notification.Milestone?.Id.ToString(),
                    MilestoneName = x.Notification.Milestone?.Name.ToString(),
                    Message = x.Notification.NotificationCategory.Message,
                    IsSeen = x.IsSeen,
                    DateCreated = x.Notification.DateCreated
                });

        return Ok(notifications);
    }

    [HttpPost("mark-as-read")]
    public IActionResult MarkNotificationAsRead([FromBody] MarkNotificationAsRead payload)
    {
        List<NotificationLog> notificationsForUser = _context.NotificationLogs
            .Where(x => x.UserId == Guid.Parse(payload.UserId))
            .ToList();
        
        foreach(NotificationLog notification in notificationsForUser)
        {
            if (payload.NotificationIdList.Contains(notification.NotificationId.ToString("D")))
            {
                notification.IsSeen = true;
            }    
        }

        _context.SaveChanges();
        return Ok();
    }

    [HttpGet("search")]
    public IActionResult SearchNotifications(
        [FromQuery] string userId,
        [FromQuery] string? query,
        [FromQuery] string scope)
    {
        if (query == null || query.Trim() == "")
        {
            query = "";
        }

        List<NotificationLog> notificationLogs = _notificationService.GetNotificationsForUser(userId);

        var notifications =
            notificationLogs
                .OrderByDescending(x => x.DateCreated)
                .Select(x => new
                {
                    Id = x.NotificationId.ToString("D"),
                    ProjectId = x.Notification.ProjectId.ToString(),
                    ProjectName = x.Notification.Project.Name,
                    MilestoneId = x.Notification.Milestone?.Id.ToString(),
                    MilestoneName = x.Notification.Milestone?.Name.ToString(),
                    Message = x.Notification.NotificationCategory.Message,
                    IsSeen = x.IsSeen,
                    DateCreated = x.Notification.DateCreated
                });

        if (scope == "Projects")
        {
            notifications = notifications.Where(x => x.MilestoneName == null);
        }
        else if (scope == "Milestones")
        {
            notifications = notifications.Where(x => x.MilestoneName != null);
        }

        var searchResults = notifications
            .Where(x => x.ProjectName.ToLower().Contains(query.ToLower()) ||
                        (x.MilestoneName != null && x.MilestoneName.ToLower().Contains(query.ToLower())) ||
                        x.Message.ToLower().Contains(query.ToLower()))
            .ToList();

        return Ok(searchResults);
    }

    [HttpGet("{notificationId}")]
    public IActionResult GetNotification(string notificationId)
    {
        var notification = _context.Notifications
            .Include(x => x.NotificationCategory)
            .Include(x => x.Project)
            .Include(x => x.Milestone)
            .SingleOrDefault(x => x.Id == Guid.Parse(notificationId));

        if (notification == null)
        {
            return NotFound($"Notification with Id {notificationId} does not exist.");
        }

        return Ok(new
        {
            Id = notification.Id.ToString("D"),
            NotificationCategoryName = notification.NotificationCategory.Name,
            NotificationCategoryId = notification.NotificationCategoryId.ToString("D"),
            ProjectName = notification.Project.Name,
            ProjectId = notification.ProjectId.ToString("D"),
            MilestoneName = notification.Milestone?.Name,
            MilestoneId = notification.MilestoneId?.ToString("D"),
            DateCreated = notification.DateCreated
        });
    }

    [HttpGet("categories")]
    public IActionResult GetNotificationCategories()
    {
        return Ok(_notificationService.GetAllNotificationCategories());
    }
}