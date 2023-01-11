using PMAS_CITI.Models;

namespace PMAS_CITI.Services;

public class ProjectMemberService
{
    private PMASCITIDbContext _context;

    public ProjectMemberService(PMASCITIDbContext context)
    {
        _context = context;
    }

    public int InsertProjectMember(ProjectMember projectMember)
    {
        _context.ProjectMembers.Add(projectMember);
        return _context.SaveChanges();
    }
}