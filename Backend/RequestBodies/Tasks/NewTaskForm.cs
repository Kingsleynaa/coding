namespace PMAS_CITI.RequestBodies.Tasks;

// TODO: Allow the assigning of project members into tasks.
public class NewTaskForm
{
    public string Name { get; set; }
    public string Description { get; set; }
    public string MilestoneId { get; set; }
    public List<string> AssignedToUserIdList { get; set; }
}