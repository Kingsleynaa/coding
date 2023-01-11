using System;
using System.Collections.Generic;

namespace PMAS_CITI.Models
{
    public partial class ProjectDocumentType
    {
        public ProjectDocumentType()
        {
            ProjectDocuments = new HashSet<ProjectDocument>();
        }

        public Guid Id { get; set; }
        public string Name { get; set; } = null!;

        public virtual ICollection<ProjectDocument> ProjectDocuments { get; set; }
    }
}
