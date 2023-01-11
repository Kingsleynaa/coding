namespace PMAS_CITI.AzureDevOps.Models.Commit;

public class AzureCommitList
{
    public int Count { get; set; }
    public List<Commit> Value { get; set; }
}