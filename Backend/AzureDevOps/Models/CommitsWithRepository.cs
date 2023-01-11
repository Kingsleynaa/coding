using PMAS_CITI.AzureDevOps.Models.Commit;
using PMAS_CITI.AzureDevOps.Models.Repository;

namespace PMAS_CITI.AzureDevOps.Models;

public class CommitsWithRepository
{
    public AzureRepository Repository { get; set; }
    public AzureCommitList Commits { get; set; }
}