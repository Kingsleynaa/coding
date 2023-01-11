using PMAS_CITI.Enums;

namespace PMAS_CITI.RequestBodies.Projects;

public class SearchQuery
{
    public List<string> UserIdList { get; set; }
    public string GenericQuery { get; set; }
    public string UserRoleId { get; set; }

    public string ProjectStatus { get; set; }
    public DateTime? DateProjectedStart { get; set; }
    public DateTime? DateProjectedEnd { get; set; }

    public string ProjectScope { get; set; }
    public string Sort { get; set; }
}