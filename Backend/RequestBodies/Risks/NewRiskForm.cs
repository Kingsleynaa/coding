namespace PMAS_CITI.RequestBodies.Risks;

public class NewRiskForm
{
    public string CategoryId { get; set; }
    public string LikelihoodId { get; set; }
    public string SeverityId { get; set; }
    public string Mitigation { get; set; }
    public string Description { get; set; }
    public string ProjectId { get; set; }
}