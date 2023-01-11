using Microsoft.AspNetCore.Components.Forms;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using PMAS_CITI.Controllers;
using PMAS_CITI.Enums;
using PMAS_CITI.Models;
using PMAS_CITI.QuartzConfig;
using PMAS_CITI.ResponseObjects;
using PMAS_CITI.Utils;
using Quartz;

using System.Linq;
using System.Reflection.Metadata;

namespace PMAS_CITI.Services
{
    public class ProjectService
    {
        private readonly PMASCITIDbContext _context;
        private readonly NotificationService _notificationService;
        private readonly IConfiguration _configuration;

        public ProjectService(PMASCITIDbContext context, NotificationService notificationService,
            IConfiguration configuration)
        {
            _context = context;
            _notificationService = notificationService;
            _configuration = configuration;
        }

        public class ProjectPageModel : PageModel
        {
            public readonly ProjectService _projectService;

            public ProjectPageModel(ProjectService projectService)
            {
                _projectService = projectService;
            }
            public Project Project { get; set; }

            public bool GetProjectById(string projectId)
            {
                Project = _projectService.GetProjectById(projectId);
                if (Project != null)
                {
                    ViewData["ProjectId"] = projectId;
                    ViewData["ProjectName"] = Project.Name;
                  
                    return true;
                }
                return false;
            }
        }

        

        /// <summary>
        /// Updates the project's DateUpdated field to the current date and time, and schedules a job 2 months from the DateUpdated field.
        /// This function also removes any jobs that are created previously for the project using this function.
        /// </summary>
        /// <param name="targetedProject">The project that is having its DateUpdated field updated.</param>
        /// <returns>The amount of records changed in the database after the project's DateUpdated field is changed.</returns>

        /// <summary>
        /// Retrieves project/milestone information using ProjectId/MilestoneId and formats data into a Chart Data Object
        /// </summary>
        /// <param name="projectId"></param>
        /// <param name="milestoneId"></param>
        /// <returns>Object with labels and data to be parsed by Chart.js to render charts</returns>

        public async Task<int> SetCurrentDateTimeToProjectLastUpdated(Project targetedProject)
        {
            string notificationCategoryId =
                StringFormatting.FormatStringAsGuid(
                    _configuration["Notifications:Categories:Project not updated recently.:Id"]);

            // Setting the last modified date
            targetedProject.DateUpdated = DateTime.Now;

            IJobDetail? job = _notificationService.BuildNotificationJobForProject(
                targetedProject.Id.ToString(),
                notificationCategoryId
            );

            // Checking if previous jobs exists and deleting them.
            if (await _notificationService.CheckJobExist(targetedProject.Id.ToString(), notificationCategoryId))
            {
                _notificationService.DeleteJob(targetedProject.Id.ToString(), notificationCategoryId);
            }

            // TODO: Change this to 2 months for production
            // For demonstration, the timespan is set to 3 seconds. 
            ITrigger trigger = Trigger.Build(
                targetedProject.Id.ToString(),
                notificationCategoryId,
                targetedProject.DateUpdated.AddSeconds(10)
            );

            _notificationService.QueueJob(job, trigger);
            return _context.SaveChanges();
        }

        public async void QueueNotificationForProjectOverdue(Project targetedProject)
        {
            string projectCompletionOverdueNotification =
                StringFormatting.FormatStringAsGuid(
                    _configuration["Notifications:Categories:Project completion overdue.:Id"]);

            IJobDetail? job = _notificationService.BuildNotificationJobForProject(
                targetedProject.Id.ToString("D"),
                projectCompletionOverdueNotification
            );

            ITrigger trigger = Trigger.Build(
                targetedProject.Id.ToString(),
                projectCompletionOverdueNotification,
                targetedProject.DateProjectedEnd
            );

            // Checking if previous jobs exists and deleting them.
            if (await _notificationService.CheckJobExist(targetedProject.Id.ToString("D"),
                    projectCompletionOverdueNotification))
            {
                _notificationService.DeleteJob(targetedProject.Id.ToString("D"), projectCompletionOverdueNotification);
            }

            _notificationService.QueueJob(job, trigger);
        }

        public PaymentInformation GetPaymentInformation(Project targetedProject)
        {
            double totalPaymentAmount = targetedProject.PaymentAmount ?? 0;

            // If no payment amount has been set for the project.
            if (totalPaymentAmount == 0)
            {
                return new PaymentInformation()
                {
                    Total = totalPaymentAmount,
                    Paid = 0.0,
                    Outstanding = 0.0,
                    Milestones = 0.0
                };
            }

            double paidPaymentAmount = _context.ProjectMilestones
                .Where(x => x.IsPaid && x.ProjectId == targetedProject.Id)
                .ToList()
                .Sum(x => totalPaymentAmount * x.PaymentPercentage / 100);
            
            double milestonesAmount = _context.ProjectMilestones
                .Where(x => x.ProjectId == targetedProject.Id)
                .ToList()
                .Sum(x => totalPaymentAmount * x.PaymentPercentage / 100);

            return new PaymentInformation()
            {
                Total = totalPaymentAmount,
                Paid = paidPaymentAmount,
                Outstanding = totalPaymentAmount - paidPaymentAmount,
                Milestones = milestonesAmount
            };
        }

        public int InsertProject(Project project)
        {
            _context.Projects.Add(project);
            return _context.SaveChanges();
        }

        public Project? GetProjectById(string id)
        {
            return _context.Projects
                .SingleOrDefault(p => p.Id.ToString() == id);
        }

        public List<Project> GetAllProjects()
        {
            return _context.Projects.ToList();
        }

        public int DeleteProjectById(string id)
        {
            Project? project = _context.Projects
                .SingleOrDefault(p => p.Id.ToString() == id);

            if (project == null)
            {
                return -1;
            }

            IQueryable<ProjectMember> projectMembers = _context.ProjectMembers
                .Where(x => x.ProjectId == project.Id);

            _context.Projects.Remove(project);
            _context.ProjectMembers.RemoveRange(projectMembers);

            return _context.SaveChanges();
        }

        public int DeleteProject(Project targetedProject)
        {
            IQueryable<Notification> projectNotifications = _context.Notifications.Where(x => x.Project == targetedProject);
            _context.Notifications.RemoveRange(projectNotifications);
            
            IQueryable<ProjectMember> projectMembers = _context.ProjectMembers
                .Where(x => x.ProjectId == targetedProject.Id);

            _context.Projects.Remove(targetedProject);
            _context.ProjectMembers.RemoveRange(projectMembers);

            return _context.SaveChanges();
        }

        public ProjectMember? GetProjectLeadForProject(string projectId)
        {
            return _context.ProjectMembers
                .Include(x => x.ProjectRole)
                .Include(x => x.User)
                .FirstOrDefault(x => x.ProjectRole.Name == "Project Lead" &&
                                     x.ProjectId == Guid.Parse(projectId));
        }

        public ProjectMember? GetProjectCreatorForProject(string projectId)
        {
            return _context.ProjectMembers
                .Include(x => x.ProjectRole)
                .Include(x => x.User)
                .FirstOrDefault(x => x.ProjectRole.Name == "Creator" &&
                                     x.ProjectId == Guid.Parse(projectId));
        }

        public ProjectStatus? GetProjectStatus(string projectId)
        {
            Project? targetedProject = GetProjectById(projectId);

            if (targetedProject == null)
            {
                return null;
            }

            DateTime currentDate = DateTime.Now;

            if (!targetedProject.IsCompleted && targetedProject.DateProjectedEnd > currentDate)
            {
                return ProjectStatus.ONGOING;
            }

            if (targetedProject.IsCompleted && !targetedProject.IsPaid &&
                currentDate > targetedProject.DateActualEnd.Value.AddMonths(2))
            {
                return ProjectStatus.OVERDUE_PAYMENT;
            }

            if (targetedProject.IsCompleted && !targetedProject.IsPaid)
            {
                return ProjectStatus.AWAITING_PAYMENT;
            }

            if (!targetedProject.IsCompleted && targetedProject.DateProjectedEnd < currentDate)
            {
                return ProjectStatus.OVERDUE_COMPLETION;
            }


            if (targetedProject.IsCompleted && targetedProject.IsPaid)
            {
                return ProjectStatus.PAID;
            }

            return null;



        }
        

        

        public Project? GetProjectByIdForChart(string projectId)
        {
            return _context.Projects
                .Include(pm => pm.ProjectMembers).ThenInclude(pmt => pmt.ProjectMemberTasks)
                .ThenInclude(pt => pt.Task).ThenInclude(milestone => milestone.Milestone)
                .Include(pm => pm.ProjectMembers).ThenInclude(User => User.User)
                .SingleOrDefault(p => p.Id.ToString() == projectId);
        }

        public List<ProjectMilestone> GetMilestonesIdForChart(string projectId)
        {


            return _context.ProjectMilestones
                .Include(r => r.Id)
                .Include(r => r.Name)
                .Where(r => r.Project.Id.ToString() == projectId)
                .ToList();


        }

        /*public ChartDataObject TestingChartData(string projectId)
        {
            ChartDataObject chartData = new ChartDataObject();
            List<ProjectMilestone> milestones = GetMilestonesIdForChart(projectId);

            foreach (ProjectMilestone milestone in milestones)
            {
                
            };
        }*/

        //public ChartDataObject GetChartData(string projectId, string? milestoneId)
        //{
        //    ChartDataObject chartData = new ChartDataObject();


        //    Project project = GetProjectByIdForChart(projectId)!;
        //    foreach (ProjectMember member in project.ProjectMembers)
        //    {
        //        chartData.Labels.Add(member.User.FullName);
        //        List<ProjectMemberTask> tasks = member.ProjectMemberTasks.ToList();
        //        if (milestoneId == null)
        //        {
        //            chartData.Data.Add(member.ProjectMemberTasks.Where(t => t.ProjectId.ToString() == projectId && t.Task.IsCompleted==true).Count());
        //        }
        //        else
        //        {
        //            chartData.Data.Add(member.ProjectMemberTasks.Where(t => t.Task.MilestoneId.ToString() == milestoneId && t.ProjectId.ToString() == projectId
        //       && t.Task.IsCompleted == true).Count());
        //        }
                
               
                
        //    };
        //    return chartData;
        

        public ChartDataObject GetChartData(string projectId, string? milestoneId)
        {
            ChartDataObject chartData = new ChartDataObject();

            Project project = GetProjectByIdForChart(projectId)!;
            foreach (ProjectMember member in project.ProjectMembers)
            {
                chartData.Labels.Add(member.User.FullName);
                List<ProjectMemberTask> tasks = member.ProjectMemberTasks.ToList();

                if (milestoneId == "overall")
                {
                    // Get the total number of tasks for all milestones
                    int totalTasks = member.ProjectMemberTasks.Where(t => t.ProjectId.ToString() == projectId && t.Task.IsCompleted == true).Count();
                    chartData.Data.Add(totalTasks);
                }
                else if (milestoneId == null)
                {
                    // If no milestone is selected, return the tasks for all milestones
                    chartData.Data.Add(member.ProjectMemberTasks.Where(t => t.ProjectId.ToString() == projectId && t.Task.IsCompleted == true).Count());
                }
                else
                {
                    // Return the tasks for the specified milestone
                    chartData.Data.Add(member.ProjectMemberTasks.Where(t => t.Task.MilestoneId.ToString() == milestoneId && t.ProjectId.ToString() == projectId
                    && t.Task.IsCompleted == true).Count());
                }
            }
            return chartData;
        }


        public ChartDataObject GetAllChartData(string projectId)
        {
            ChartDataObject chartData = new ChartDataObject();
            Project project = GetProjectByIdForChart(projectId)!;
            foreach (ProjectMember member in project.ProjectMembers)
            {

                chartData.Labels.Add(member.User.FullName);
                List<ProjectMemberTask> tasks = member.ProjectMemberTasks.ToList();
                chartData.Data.Add(member.ProjectMemberTasks.Where(t => t.ProjectId.ToString() == projectId).Count());

            };
            return chartData;
        }

        public List<ProjectMember> QueryProjectMembers(string projectId, string? query, string? selectedRole)
        {
            return _context.ProjectMembers
                .Include(pm => pm.User)
                .Include(pm => pm.ProjectRole)
                .Where(pm => pm.Project.Id.ToString() == projectId
                && (query != null ? (pm.User.FullName.Contains(query) || pm.User.Email.Contains(query)) : true)
                && (selectedRole != null ? (pm.ProjectRole.Id.ToString() == selectedRole) : true))
                .OrderBy(pm => pm.ProjectRole.Id)
                .ToList();
        }

        public List<ProjectRequirement> GetAllHardwareRequirementsForProject(string projectId)
        {
            Enum RT = RequirementType.Hardware;
            return _context.ProjectRequirements.Where(r => r.Project.Id.ToString() == projectId && r.RequirementType.Name == "Hardware").ToList();
        }

        public List<ProjectRequirement> GetAllSoftwareRequirementsForProject(string projectId)
        {
            Enum RT = RequirementType.Software;
            return _context.ProjectRequirements.Where(r => r.Project.Id.ToString() == projectId && r.RequirementType.Name == "Software").ToList();
        }
        public List<ProjectDocument> GetDocumentsForProject(string projectId, string? documentTypeId)
        {
            return _context.ProjectDocuments.Where(d => d.Project.Id.ToString() == projectId
            && (documentTypeId != null ? d.DocumentType.Id.ToString() == documentTypeId : true))
                .OrderByDescending(d => d.DateUploaded)
                .ToList();      
        }

        public Project? GetProjectByIdForReport(string projectId)   //REPORT
        {

            return _context.Projects
                .Include(p => p.ProjectMembers)
                .Include(p => p.ProjectMilestones)
                .SingleOrDefault(p => p.Id.ToString() == projectId);

        }
        

    }
}