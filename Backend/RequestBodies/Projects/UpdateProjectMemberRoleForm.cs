namespace PMAS_CITI.RequestBodies.Projects;

public class UpdateProjectMemberRoleForm
{
    public string ProjectId { get; set; }
    public string MemberId { get; set; }
    public string RoleId { get; set; }
}