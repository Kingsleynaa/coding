namespace PMAS_CITI.RequestBodies.Risks;

public class UpdateRiskForm
{
    public string RiskCategoryId { get; set; }
    public string RiskSeverityId { get; set; }
    public string RiskLikelihoodId { get; set; }
    public string Description { get; set; }
    public string Mitigation { get; set; }
}