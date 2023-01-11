using System;
using System.Collections.Generic;

namespace PMAS_CITI.Models
{
    public partial class EmailTemplate
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public Guid NotificationCategoryId { get; set; }
        public string Subject { get; set; } = null!;
        public string Body { get; set; } = null!;
        public DateTime DateCreated { get; set; }
        public DateTime DateUpdated { get; set; }

        public virtual NotificationCategory NotificationCategory { get; set; } = null!;
    }
}
