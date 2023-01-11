using PMAS_CITI.Enums;
using System;
using System.Collections.Generic;

namespace PMAS_CITI.Models
{
    public partial class ProjectRequirement
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public Guid ProjectId { get; set; }
        public Guid RequirementTypeId { get; set; }
        
        public virtual Project Project { get; set; } = null!;
        public virtual ProjectRequirementType RequirementType { get; set; } = null!;
    }
}
