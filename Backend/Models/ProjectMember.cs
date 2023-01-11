using System;
using System.Collections.Generic;

namespace PMAS_CITI.Models
{
    public partial class ProjectMember
    {
        public ProjectMember()
        {
            ProjectMemberTasks = new HashSet<ProjectMemberTask>();
        }

        public Guid ProjectId { get; set; }
        public Guid UserId { get; set; }
        public Guid ProjectRoleId { get; set; }
        public DateTime DateJoined { get; set; }

        public virtual Project Project { get; set; } = null!;
        public virtual ProjectRole ProjectRole { get; set; } = null!;
        public virtual User User { get; set; } = null!;
        public virtual ICollection<ProjectMemberTask> ProjectMemberTasks { get; set; }

        
    }
}
