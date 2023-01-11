namespace PMAS_CITI.RequestBodies.Documents;

public class AddDocumentsToProjectForm
{
    public string ProjectId { get; set; }
    
    // TOOD: Change type to ENUM
    public string DocumentTypeId { get; set; }

    public List<IFormFile> Files { get; set; }
}