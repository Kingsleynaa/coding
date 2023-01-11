using System;
using System.Collections.Generic;

namespace PMAS_CITI.Models
{
    public partial class ProjectDocument
    {
        public Guid Id { get; set; }
        public Guid ProjectId { get; set; }
        public Guid UploadedByUserId { get; set; }
        public DateTime DateUploaded { get; set; }
        public Guid DocumentTypeId { get; set; }
        public string FileName { get; set; } = null!;

        public virtual ProjectDocumentType DocumentType { get; set; } = null!;
        public virtual Project Project { get; set; } = null!;
        public virtual User UploadedByUser { get; set; } = null!;
    }
}
    