namespace PMAS_CITI.AzureDevOps.Models.Repository;

public class AzureRepository
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string Url { get; set; }
    public AzureProject Project { get; set; }
    public string DefaultBranch { get; set; }
    public int Size { get; set; }
    public string RemoteUrl { get; set; }
    public string SSHUrl { get; set; }
    public string WebUrl { get; set; }
    public bool IsDisabled { get; set; }
    
}