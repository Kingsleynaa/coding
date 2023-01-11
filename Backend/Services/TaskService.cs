using Microsoft.EntityFrameworkCore;
using PMAS_CITI.Enums;
using PMAS_CITI.Models;

namespace PMAS_CITI.Services;

public class TaskService
{
    private PMASCITIDbContext _context { get; set; }
    
    public TaskService(PMASCITIDbContext context)
    {
        _context = context;
    }

    public int InsertTask(ProjectTask task)
    {
        _context.ProjectTasks.Add(task);
        return _context.SaveChanges();
    }

    public List<ProjectTask> GetTasksByMilestoneId(string milestoneId)
    {
        return _context.ProjectTasks.Where(t => t.MilestoneId.ToString() == milestoneId).ToList();
    }

    public ProjectTask? GetTaskById(string id)
    {
        return _context.ProjectTasks.SingleOrDefault(t => t.Id.ToString() == id);
    }

    public int DeleteTaskById(string id)
    {
        ProjectTask? task = _context.ProjectTasks.SingleOrDefault(t => t.Id.ToString() == id);
        if (task == null)
        {
            return -1;
        }

        _context.Remove(task);
        return _context.SaveChanges();
    }

    public int DeleteTask(ProjectTask task)
    {
        _context.ProjectTasks.Remove(task);
        return _context.SaveChanges();
    }

    public int AssignMembersToTask(List<string> userIdList, string taskId)
    {
        ProjectTask? task = _context.ProjectTasks
            .Include(t => t.Milestone)
            .SingleOrDefault(t => t.Id == Guid.Parse(taskId));
        
        if (task == null)
        {
            return -1;
        }

        foreach (string userId in userIdList)
        {
            ProjectMember? currentMember = _context.ProjectMembers.SingleOrDefault(
                x => x.UserId == Guid.Parse(userId) && x.ProjectId == task.Milestone.ProjectId
                );

            if (currentMember == null)
            {
                continue;
            }
            
            _context.ProjectMemberTasks.Add(new ProjectMemberTask()
            {
                TaskId = Guid.Parse(taskId),
                ProjectMember = currentMember,
                ProjectId = task.Milestone.ProjectId,
                DateAssigned = DateTime.Now
            });
        }

        return _context.SaveChanges();
    }

    public List<ProjectTask> GetIncompleteTasksByMilestoneId(string milestoneId)
    {
        return _context.ProjectTasks
            .AsNoTracking()
            .Where(x =>
                x.MilestoneId == Guid.Parse(milestoneId) &&
                !x.IsCompleted
            )
            .ToList();
    }
}