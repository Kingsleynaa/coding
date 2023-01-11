using System;
using System.Collections.Generic;

namespace PMAS_CITI.Models
{
    public partial class PlatformRole
    {
        public PlatformRole()
        {
            Users = new HashSet<User>();
        }

        public Guid Id { get; set; }
        public string Name { get; set; } = null!;

        public virtual ICollection<User> Users { get; set; }
    }
}
