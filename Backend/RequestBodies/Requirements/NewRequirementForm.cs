namespace PMAS_CITI.RequestBodies.Requirements;

public class NewRequirementForm
{
    public string ProjectId { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public string RequirementTypeId { get; set; }
}