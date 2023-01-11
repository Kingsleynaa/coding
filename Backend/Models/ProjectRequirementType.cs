using System;
using System.Collections.Generic;

namespace PMAS_CITI.Models
{
    public partial class ProjectRequirementType
    {
        public ProjectRequirementType()
        {
            ProjectRequirements = new HashSet<ProjectRequirement>();
        }

        public Guid Id { get; set; }
        public string Name { get; set; } = null!;

        public virtual ICollection<ProjectRequirement> ProjectRequirements { get; set; }
    }
}
