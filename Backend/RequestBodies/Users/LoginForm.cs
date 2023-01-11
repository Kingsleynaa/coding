using DataAnnotationsExtensions;
using System.ComponentModel.DataAnnotations;

namespace PMAS_CITI.RequestBodies
{
    public class LoginForm
    {
        [Required]
        [Email]
        public string Email { get; set; }

        [Required]
        public string Password { get; set; }
    }
}
