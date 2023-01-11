namespace PMAS_CITI.RequestBodies.Documents;

public class DeleteDocumentsFromProjectForm
{
    public List<string> DocumentIdList { get; set; }
    public string ProjectId { get; set; }
}