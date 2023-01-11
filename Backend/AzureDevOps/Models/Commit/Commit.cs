namespace PMAS_CITI.AzureDevOps.Models.Commit;

public class Commit
{
    public string CommitId { get; set; }
    public Author Author { get; set; }
    public Author Committer { get; set; }
    public string Comment { get; set; }
    public ChangeCounts ChangeCounts { get; set; }
    public string Url { get; set; }
    public string RemoteUrl { get; set; }
}