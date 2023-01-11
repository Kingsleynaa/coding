using System;
using System.Collections.Generic;

namespace PMAS_CITI.Models
{
    public partial class RiskSeverity
    {
        public RiskSeverity()
        {
            ProjectRisks = new HashSet<ProjectRisk>();
        }

        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public virtual ICollection<ProjectRisk> ProjectRisks { get; set; }
    }
}
