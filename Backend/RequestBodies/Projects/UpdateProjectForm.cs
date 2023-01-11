using System.ComponentModel.DataAnnotations;

namespace PMAS_CITI.RequestBodies.Projects;

public class UpdateProjectForm
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public double PaymentAmount { get; set; } = 0;
    public string? AzureProjectId { get; set; }

    [DataType(DataType.Date)] public DateTime DateProjectedStart { get; set; }

    [DataType(DataType.Date)] public DateTime DateProjectedEnd { get; set; }

    [DataType(DataType.Date)] public DateTime? DateActualStart { get; set; }

    [DataType(DataType.Date)] public DateTime? DateActualEnd { get; set; }
}