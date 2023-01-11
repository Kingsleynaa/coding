namespace PMAS_CITI.RequestBodies.Projects;

public class MembersSearchParameters
{
    public bool IsProjectMember { get; set; } = false;
    public string Query { get; set; } = "";
    public int ResultsSize { get; set; } = 10;
    public int ResultsPage { get; set; } = 0;
    public List<string> UserIdListToExclude { get; set; } = new List<string>();
}