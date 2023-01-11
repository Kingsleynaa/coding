using System;
using System.Collections.Generic;

namespace PMAS_CITI.Models
{
    public partial class ProjectTask
    {
        public ProjectTask()
        {
            ProjectMemberTasks = new HashSet<ProjectMemberTask>();
        }

        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public bool IsCompleted { get; set; }
        public DateTime DateCreated { get; set; }
        public DateTime DateUpdated { get; set; }
        public Guid MilestoneId { get; set; }


        public virtual ProjectMilestone Milestone { get; set; } = null!;
        public virtual ICollection<ProjectMemberTask> ProjectMemberTasks { get; set; }
    }
}
