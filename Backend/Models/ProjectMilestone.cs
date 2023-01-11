using PMAS_CITI.Enums;
using System;
using System.Collections.Generic;

namespace PMAS_CITI.Models
{
    public partial class ProjectMilestone
    {
        public ProjectMilestone()
        {
            Notifications = new HashSet<Notification>();
            ProjectTasks = new HashSet<ProjectTask>();
        }

        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public DateTime DateProjectedStart { get; set; }
        public DateTime DateProjectedEnd { get; set; }
        public DateTime? DateActualStart { get; set; }
        public DateTime? DateActualEnd { get; set; }
        public DateTime DateUpdated { get; set; }
        public DateTime DateCreated { get; set; }
        public DateTime? DatePaid { get; set; }
        public bool IsPaid { get; set; }
        public int PaymentPercentage { get; set; }
        public bool IsCompleted { get; set; }
        public Guid ProjectId { get; set; }
        public Guid CreatedById { get; set; }
        

        public virtual Project Project { get; set; } = null!;
        public virtual ICollection<Notification> Notifications { get; set; }
        public virtual ICollection<ProjectTask> ProjectTasks { get; set; }
    }
}
