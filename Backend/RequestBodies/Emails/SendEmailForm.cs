namespace PMAS_CITI.RequestBodies.Emails;

public class SendEmailForm
{
    public List<string> UserIdList { get; set; }
    public string Subject { get; set; }
    public string Body { get; set; }
    public string HTMLContent { get; set; }
}