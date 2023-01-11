using Microsoft.EntityFrameworkCore;
using PMAS_CITI.Enums;
using PMAS_CITI.Models;
using PMAS_CITI.QuartzConfig;
using PMAS_CITI.Utils;
using Quartz;
using Quartz.Core;

namespace PMAS_CITI.Services
{
    public class MilestoneService
    {
        private readonly PMASCITIDbContext _context;
        private readonly NotificationService _notificationService;
        private readonly IConfiguration _configuration;

        public MilestoneService(PMASCITIDbContext context, NotificationService notificationService,
            IConfiguration configuration)
        {
            _context = context;
            _notificationService = notificationService;
            _configuration = configuration;
        }

        /// <summary>
        /// Queue a job that checks if milestone is marked completed by its date projected end,
        /// If that check fails, a notification would be sent to the user.
        /// </summary>
        /// <param name="targetedMilestone">The milestone that is having its completion progress checked.</param>
        public async void QueueNotificationForMilestoneCompletionOverdue(ProjectMilestone targetedMilestone)
        {
            string milestoneCompletionOverdue =
                StringFormatting.FormatStringAsGuid(
                    _configuration["Notifications:Categories:Milestone completion overdue.:Id"]);

            IJobDetail? job = _notificationService.BuildNotificationJobForMilestone(
                targetedMilestone.ProjectId.ToString("D"),
                targetedMilestone.Id.ToString("D"),
                milestoneCompletionOverdue);

            ITrigger trigger = Trigger.Build(
                targetedMilestone.Id.ToString("D"),
                milestoneCompletionOverdue,
                targetedMilestone.DateProjectedEnd
            );

            if (await _notificationService.CheckJobExist(targetedMilestone.Id.ToString("D"),
                    milestoneCompletionOverdue))
            {
                _notificationService.DeleteJob(targetedMilestone.Id.ToString("D"), milestoneCompletionOverdue);
            }

            _notificationService.QueueJob(job, trigger);
        }

        /// <summary>
        /// Queue a job that checks if milestone is marked as paid after 2 months of its date actual endc
        /// If that check fails, a notification would be sent to the user.
        /// </summary>
        /// <param name="targetedMilestone">The milestone that is having its payment status checked.</param>
        public async void QueueNotificationForMilestonePaymentOverdue(ProjectMilestone targetedMilestone)
        {
            if (targetedMilestone.DateActualEnd == null)
            {
                return;
            }

            string milestonePaymentOverdue =
                StringFormatting.FormatStringAsGuid(
                    _configuration["Notifications:Categories:Milestone payment overdue.:Id"]);

            IJobDetail? job = _notificationService.BuildNotificationJobForMilestone(
                targetedMilestone.ProjectId.ToString("D"),
                targetedMilestone.Id.ToString("D"),
                milestonePaymentOverdue);

            ITrigger trigger = Trigger.Build(
                targetedMilestone.Id.ToString("D"),
                milestonePaymentOverdue,
                targetedMilestone.DateActualEnd.Value.AddSeconds(10)
            );

            if (await _notificationService.CheckJobExist(targetedMilestone.Id.ToString("D"),
                    milestonePaymentOverdue))
            {
                _notificationService.DeleteJob(targetedMilestone.Id.ToString("D"), milestonePaymentOverdue);
            }

            _notificationService.QueueJob(job, trigger);
        }

        public int InsertMilestone(ProjectMilestone projectMilestone)
        {
            _context.ProjectMilestones.Add(projectMilestone);
            return _context.SaveChanges();
        }

        public int DeleteMilestoneById(string milestoneId)
        {
            ProjectMilestone? milestone = GetMilestoneById(milestoneId);

            if (milestone == null)
            {
                return -1;
            }

            _context.ProjectMilestones.Remove(milestone);
            return _context.SaveChanges();
        }

        public int DeleteMilestone(ProjectMilestone milestone)
        {
            var projectMilestones = _context.Notifications
                .Where(x => x.Milestone == milestone);

            _context.RemoveRange(projectMilestones);

            _context.ProjectMilestones.Remove(milestone);
            return _context.SaveChanges();
        }

        public List<ProjectMilestone> SearchMilestones(
            string projectId,
            MilestoneScope scope = MilestoneScope.ALL,
            MilestoneSort sort = MilestoneSort.DATE_CREATED_DESC,
            string? query = ""
        )
        {
            if (query == null || query.Trim() == "")
            {
                query = "";
            }

            List<ProjectMilestone> searchResults = _context.ProjectMilestones
                .Where(x => x.ProjectId == Guid.Parse(projectId) &&
                            (x.Description.Contains(query) ||
                             x.Name.Contains(query)))
                .ToList();

            if (scope != MilestoneScope.ALL)
            {
                searchResults = searchResults
                    .Where(x => (int)GetMilestoneStatus(x) + 1 == (int)scope)
                    .ToList();
            }

            switch (sort)
            {
                case MilestoneSort.DATE_CREATED_ASC:
                    searchResults = searchResults
                        .OrderBy(x => x.DateCreated)
                        .ToList();
                    break;

                case MilestoneSort.DATE_CREATED_DESC:
                    searchResults = searchResults
                        .OrderByDescending(x => x.DateCreated)
                        .ToList();
                    break;

                case MilestoneSort.DATE_PROJECTED_START_ASC:
                    searchResults = searchResults
                        .OrderBy(x => x.DateProjectedStart)
                        .ToList();
                    break;

                case MilestoneSort.DATE_PROJECTED_START_DESC:
                    searchResults = searchResults
                        .OrderByDescending(x => x.DateProjectedStart)
                        .ToList();
                    break;

                case MilestoneSort.DATE_PROJECTED_END_ASC:
                    searchResults = searchResults
                        .OrderBy(x => x.DateProjectedEnd)
                        .ToList();
                    break;

                case MilestoneSort.DATE_PROJECTED_END_DESC:
                    searchResults = searchResults
                        .OrderByDescending(x => x.DateProjectedEnd)
                        .ToList();
                    break;


                case MilestoneSort.PROGRESS_DESC:
                    searchResults = searchResults
                        .OrderByDescending(GetMilestoneCompletionProgress)
                        .ToList();
                    break;

                case MilestoneSort.PROGRESS_ASC:
                    searchResults = searchResults
                        .OrderBy(GetMilestoneCompletionProgress)
                        .ToList();
                    break;

                default:
                    searchResults = searchResults
                        .OrderByDescending(x => x.DateCreated)
                        .ToList();
                    break;
            }

            return searchResults;
        }

        public int GetMilestoneCompletionProgress(ProjectMilestone milestone)
        {
            double totalTaskCount = _context.ProjectTasks
                .Count(x => x.MilestoneId == milestone.Id);

            double completedTaskCount = _context.ProjectTasks
                .Count(x => x.MilestoneId == milestone.Id && x.IsCompleted);

            if (totalTaskCount == 0)
            {
                return 0;
            }

            return Convert.ToInt32(completedTaskCount / totalTaskCount * 100);
        }

        public List<ProjectMilestone> GetIncompleteMilestonesByProjectId(string projectId)
        {
            return _context.ProjectMilestones
                .Where(x => x.ProjectId == Guid.Parse(projectId) && !x.IsCompleted)
                .ToList();
        }

        public List<ProjectMilestone> GetMilestonesByProjectId(string projectId)
        {
            return _context.ProjectMilestones
                .Where(x => x.ProjectId == Guid.Parse(projectId))
                .ToList();
        }

        public int MarkMilestoneAsCompletedById(string milestoneId)
        {
            ProjectMilestone? targetedMilestone =
                _context.ProjectMilestones.SingleOrDefault(m => m.Id.ToString() == milestoneId);
            if (targetedMilestone == null)
            {
                return -1;
            }

            targetedMilestone.IsCompleted = true;
            return _context.SaveChanges();
        }

        public ProjectMilestone? GetMilestoneById(string milestoneId)
        {
            return _context.ProjectMilestones.SingleOrDefault(m => m.Id.ToString() == milestoneId);
        }

        public MilestoneStatus? GetMilestoneStatus(ProjectMilestone targetedMilestone)
        {
            DateTime currentDate = DateTime.Now;

            if (!targetedMilestone.IsCompleted && targetedMilestone.DateProjectedEnd > currentDate && currentDate > targetedMilestone.DateProjectedStart)
            {
                return MilestoneStatus.ONGOING;
            }

            if (targetedMilestone.IsCompleted && !targetedMilestone.IsPaid &&
                targetedMilestone.DateActualEnd.HasValue &&
                currentDate > targetedMilestone.DateActualEnd.Value.AddMonths(2))
            {
                return MilestoneStatus.OVERDUE_PAYMENT;
            }

            if (targetedMilestone.IsCompleted && !targetedMilestone.IsPaid)
            {
                return MilestoneStatus.AWAITING_PAYMENT;
            }

            if (!targetedMilestone.IsCompleted && targetedMilestone.DateProjectedEnd < currentDate)
            {
                return MilestoneStatus.OVERDUE_COMPLETION;
            }

            if (targetedMilestone.IsCompleted && targetedMilestone.IsPaid)
            {
                return MilestoneStatus.PAID;
            }

            if (!targetedMilestone.IsCompleted)
            {
                return MilestoneStatus.NOT_STARTED;
            }

            return null;
        }

        public List<ProjectMilestone> GetAllMilestonesForProject(string projectId)
        {
            return _context.ProjectMilestones.Include(m => m.ProjectTasks).Where(m => m.Project.Id.ToString() == projectId).OrderBy(m => m.DateProjectedStart).ToList();
        }

        public string GetMilestonePaymentAmountString(int paymentPercentage, double projectPaymentAmount)
        {
            decimal paymentDouble = (decimal)paymentPercentage / 100m;
            return projectPaymentAmount != 0 && paymentPercentage != 0 ? string.Format("{0:.00}", (paymentDouble * (decimal)projectPaymentAmount)) : "0.00";
        }

        public ProjectTask? GetTaskById(string taskId)
        {
            return _context.ProjectTasks.Include(t => t.ProjectMemberTasks).SingleOrDefault(t => t.Id.ToString() == taskId);
        }

    }

}