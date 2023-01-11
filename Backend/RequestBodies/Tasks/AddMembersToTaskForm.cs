namespace PMAS_CITI.RequestBodies.Tasks;

public class AddMembersToTaskForm
{
    public string TaskId { get; set; }
    public List<string> UserIdList { get; set; }
}