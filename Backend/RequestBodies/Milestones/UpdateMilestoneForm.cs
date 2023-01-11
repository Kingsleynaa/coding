namespace PMAS_CITI.RequestBodies.Milestones;

public class UpdateMilestoneForm
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; } = null!;
    public DateTime DateProjectedStart { get; set; }
    public DateTime DateProjectedEnd { get; set; }
    public DateTime? DateActualStart { get; set; } = null;
    public int PaymentPercentage { get; set; } = 0;
}