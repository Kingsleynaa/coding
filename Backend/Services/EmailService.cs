using PMAS_CITI.Models;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace PMAS_CITI.Services;

public class EmailService
{
    // TODO: Don't allow duplicate email names under the same category
    private readonly PMASCITIDbContext _context;
    private readonly IConfiguration _configuration;

    public EmailService(PMASCITIDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public int InsertNewTemplate(EmailTemplate emailTemplate)
    {
        _context.EmailTemplates.Add(emailTemplate);
        return _context.SaveChanges();
    }

    public int DeleteEmailTemplate(EmailTemplate emailTemplate)
    {
        _context.Remove(emailTemplate);
        return _context.SaveChanges();
    }

    public int BulkDeleteEmailTemplate(List<EmailService> emailTemplates)
    {
        _context.RemoveRange(emailTemplates);
        return _context.SaveChanges();
    }

    public async Task<Response> SendMultipleEmails(string subject, string body, List<User> recipients,
        string htmlContent = "")
    {
        string apiKey = _configuration.GetValue<string>("SendGrid:Key");
        string name = _configuration.GetValue<string>("SendGrid:Name");
        string email = _configuration.GetValue<string>("SendGrid:Email");

        SendGridClient client = new SendGridClient(apiKey);
        EmailAddress sender = new EmailAddress(email, name);

        List<EmailAddress> recipientEmails = recipients
            .Select(x => new EmailAddress(x.Email, x.FullName))
            .ToList();

        SendGridMessage? emailContent = MailHelper.CreateSingleEmailToMultipleRecipients(
            sender,
            recipientEmails,
            subject,
            body,
            htmlContent,
            true
        );

        Response? response = await client.SendEmailAsync(emailContent);
        return response;
    }
}