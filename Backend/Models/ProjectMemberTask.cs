using System;
using System.Collections.Generic;

namespace PMAS_CITI.Models
{
    public partial class ProjectMemberTask
    {
        
        

        public Guid ProjectId { get; set; }
        public Guid TaskId { get; set; }
        public Guid UserId { get; set; }
        public DateTime DateAssigned { get; set; }

        



        public virtual Project Project { get; set; } = null!;
        public virtual ProjectMember ProjectMember { get; set; } = null!;
        public virtual ProjectTask Task { get; set; } = null!;
        



    }
}
