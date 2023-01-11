using System;
using System.Collections.Generic;

namespace PMAS_CITI.Models
{
    public partial class CommitHistory
    {
        public Guid Id { get; set; }
        public DateTime DateCommited { get; set; }
        public string Description { get; set; } = null!;
        public Guid CommitById { get; set; }
        public Guid ProjectId { get; set; }

        public virtual User CommitBy { get; set; } = null!;
        public virtual Project Project { get; set; } = null!;
    }
}
