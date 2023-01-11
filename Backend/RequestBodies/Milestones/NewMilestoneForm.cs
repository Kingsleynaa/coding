namespace PMAS_CITI.RequestBodies.Milestones
{
    public class NewMilestoneForm
    {
        public string Name { get; set; } = null!;
        public string Description { get; set; }
        public DateTime DateProjectedStart { get; set; }
        public DateTime DateProjectedEnd { get; set; }
        public DateTime? DateActualStart { get; set; }
        public int PaymentPercentage { get; set; } = 0;
        public string ProjectId { get; set; }
    }
}
