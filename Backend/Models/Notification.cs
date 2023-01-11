using System;
using System.Collections.Generic;

namespace PMAS_CITI.Models
{
    public partial class Notification
    {
        public Notification()
        {
            NotificationLogs = new HashSet<NotificationLog>();
        }

        public Guid Id { get; set; }
        public Guid NotificationCategoryId { get; set; }
        public Guid ProjectId { get; set; }
        public Guid? MilestoneId { get; set; }
        public DateTime DateCreated { get; set; }

        public virtual ProjectMilestone? Milestone { get; set; }
        public virtual NotificationCategory NotificationCategory { get; set; } = null!;
        public virtual Project Project { get; set; } = null!;
        public virtual ICollection<NotificationLog> NotificationLogs { get; set; }
    }
}
