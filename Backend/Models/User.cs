using System;
using System.Collections.Generic;

namespace PMAS_CITI.Models
{
    public partial class User
    {
        public User()
        {
            CommitHistories = new HashSet<CommitHistory>();
            NotificationLogs = new HashSet<NotificationLog>();
            ProjectDocuments = new HashSet<ProjectDocument>();
            ProjectMembers = new HashSet<ProjectMember>();
            Projects = new HashSet<Project>();
        }

        public Guid Id { get; set; }
        public string Email { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string HashedPassword { get; set; } = null!;
        public Guid PlatformRoleId { get; set; }
        public DateTime DateCreated { get; set; }

        public virtual PlatformRole PlatformRole { get; set; } = null!;
        public virtual ICollection<CommitHistory> CommitHistories { get; set; }
        public virtual ICollection<NotificationLog> NotificationLogs { get; set; }
        public virtual ICollection<ProjectDocument> ProjectDocuments { get; set; }
        public virtual ICollection<ProjectMember> ProjectMembers { get; set; }
        public virtual ICollection<Project> Projects { get; set; }
        
    }
}
