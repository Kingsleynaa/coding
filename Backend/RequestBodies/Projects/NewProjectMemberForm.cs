namespace PMAS_CITI.RequestBodies.Projects;

public class NewProjectMemberForm
{
    public string ProjectRoleId { get; set; }
    public List<string> UserIdList { get; set; }
}