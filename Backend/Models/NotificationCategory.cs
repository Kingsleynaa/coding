using System;
using System.Collections.Generic;

namespace PMAS_CITI.Models
{
    public partial class NotificationCategory
    {
        public NotificationCategory()
        {
            EmailTemplates = new HashSet<EmailTemplate>();
            Notifications = new HashSet<Notification>();
        }

        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Message { get; set; } = null!;

        public virtual ICollection<EmailTemplate> EmailTemplates { get; set; }
        public virtual ICollection<Notification> Notifications { get; set; }
    }
}
