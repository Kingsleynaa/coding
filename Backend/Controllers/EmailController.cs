using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using PMAS_CITI.Models;
using PMAS_CITI.RequestBodies.Emails;
using PMAS_CITI.Services;
using PMAS_CITI.Utils;
using SendGrid;

namespace PMAS_CITI.Controllers;

[Route("api/emails")]
[ApiController]
[EnableCors("APIPolicy")]
public class EmailController : ControllerBase
{
    private readonly EmailService _emailService;
    private readonly NotificationService _notificationService;
    private readonly PMASCITIDbContext _context;

    public EmailController(EmailService emailService, NotificationService notificationService,
        PMASCITIDbContext context)
    {
        _emailService = emailService;
        _notificationService = notificationService;
        _context = context;
    }

    [HttpPost("send")]
    public async Task<IActionResult> SendEmail(SendEmailForm emailForm)
    {
        List<User> recipients = _context.Users
            .ToList()
            .Where(x => emailForm.UserIdList.Contains(x.Id.ToString()))
            .ToList();

        Response response =
            await _emailService.SendMultipleEmails(emailForm.Subject, emailForm.Body, recipients,
                emailForm.HTMLContent);

        if (response.IsSuccessStatusCode)
        {
            return Ok();
        }

        return new ContentResult()
        {
            StatusCode = 500,
            Content = "Unable to send email"
        };
    }

    [HttpPost]
    public IActionResult InsertEmailTemplate(NewEmailTemplateForm payload)
    {
        NotificationCategory? targetedNotificationCategory =
            _notificationService.GetNotificationCategoryById(payload.NotificationCategoryId);

        if (targetedNotificationCategory == null)
        {
            NotFound($"Notification category with Id {payload.NotificationCategoryId} does not exist.");
        }

        EmailTemplate newEmailTemplate = new EmailTemplate()
        {
            Name = payload.Name,
            Subject = payload.Subject,
            Body = payload.Body,
            NotificationCategory = targetedNotificationCategory,
            DateCreated = DateTime.Now,
            DateUpdated = DateTime.Now
        };

        int recordsChanged = _emailService.InsertNewTemplate(newEmailTemplate);

        if (recordsChanged > 0)
        {
            return Ok();
        }

        return new ContentResult()
        {
            StatusCode = 500,
            Content = "Unable to insert email template."
        };
    }

    [HttpGet("templates")]
    public IActionResult GetEmailTemplatesForCategory([FromQuery] string category)
    {
        List<EmailTemplate> templates = _context.EmailTemplates
            .Where(x => x.NotificationCategoryId == StringFormatting.ConvertStringToGuid(category))
            .ToList();

        return Ok(templates);
    }
}