using System;
using System.Collections.Generic;

namespace PMAS_CITI.Models
{
    public partial class Project
    {
        public Project()
        {
            CommitHistories = new HashSet<CommitHistory>();
            Notifications = new HashSet<Notification>();
            ProjectDocuments = new HashSet<ProjectDocument>();
            ProjectMemberTasks = new HashSet<ProjectMemberTask>();
            ProjectMembers = new HashSet<ProjectMember>();
            ProjectMilestones = new HashSet<ProjectMilestone>();
            ProjectRequirements = new HashSet<ProjectRequirement>();
            ProjectRisks = new HashSet<ProjectRisk>();
        }

        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public double? PaymentAmount { get; set; }
        public string Description { get; set; } = null!;
        public bool IsCompleted { get; set; }
        public bool IsPaid { get; set; }
        public DateTime DateProjectedStart { get; set; }
        public DateTime DateProjectedEnd { get; set; }
        public DateTime? DateActualStart { get; set; }
        public DateTime? DateActualEnd { get; set; }
        public DateTime DateCreated { get; set; }
        public DateTime DatePaid { get; set; }
        public DateTime DateUpdated { get; set; }
        public Guid? CreatedyById { get; set; }
        public string? AzureProjectId { get; set; }

        public virtual User? CreatedyBy { get; set; }
        public virtual ICollection<CommitHistory> CommitHistories { get; set; }
        public virtual ICollection<Notification> Notifications { get; set; }
        public virtual ICollection<ProjectDocument> ProjectDocuments { get; set; }
        public virtual ICollection<ProjectMemberTask> ProjectMemberTasks { get; set; }
        public virtual ICollection<ProjectMember> ProjectMembers { get; set; }
        public virtual ICollection<ProjectMilestone> ProjectMilestones { get; set; }
        public virtual ICollection<ProjectRequirement> ProjectRequirements { get; set; }
        public virtual ICollection<ProjectRisk> ProjectRisks { get; set; }
    }
}
