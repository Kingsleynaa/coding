namespace PMAS_CITI.RequestBodies.Emails;

public class NewEmailTemplateForm
{
    public string Name { get; set; }
    public string NotificationCategoryId { get; set; }
    public string Subject { get; set; }
    public string Body { get; set; }
}