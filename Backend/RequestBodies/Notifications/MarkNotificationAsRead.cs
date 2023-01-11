namespace PMAS_CITI.RequestBodies.Notifications;

public class MarkNotificationAsRead
{
    public string UserId { get; set; }
    public List<string> NotificationIdList { get; set; }
}