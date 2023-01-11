using System;
using System.Collections.Generic;

namespace PMAS_CITI.Models
{
    public partial class NotificationLog
    {
        public Guid NotificationId { get; set; }
        public Guid UserId { get; set; }
        public bool IsSeen { get; set; }
        public DateTime DateCreated { get; set; }

        public virtual Notification Notification { get; set; } = null!;
        public virtual User User { get; set; } = null!;
    }
}
