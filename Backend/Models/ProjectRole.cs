using System;
using System.Collections.Generic;

namespace PMAS_CITI.Models
{
    public partial class ProjectRole
    {
        public ProjectRole()
        {
            ProjectMembers = new HashSet<ProjectMember>();
        }

        public Guid Id { get; set; }
        public string Name { get; set; } = null!;

        public virtual ICollection<ProjectMember> ProjectMembers { get; set; }
    }
}
