namespace PMAS_CITI.RequestBodies;

public class UserFilters
{
    public string Query { get; set; }
    public List<string> UserIdlist { get; set; }
    public int ResultSize { get; set; }
    public int ResultPage { get; set; }
}