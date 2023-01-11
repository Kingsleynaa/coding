using System;
using System.Collections.Generic;

namespace PMAS_CITI.Models
{
    public partial class ProjectRisk
    {
        public Guid Id { get; set; }
        public string Mitigation { get; set; } = null!;
        public string Description { get; set; } = null!;
        public Guid RiskCategoryId { get; set; }
        public Guid RiskSeverityId { get; set; }
        public Guid RiskLikelihoodId { get; set; }
        public Guid ProjectId { get; set; }
        
        public virtual Project Project { get; set; } = null!;
        public virtual RiskCategory RiskCategory { get; set; } = null!;
        public virtual RiskLikelihood RiskLikelihood { get; set; } = null!;
        public virtual RiskSeverity RiskSeverity { get; set; } = null!;
    }
}
