using PMAS_CITI.Models;
using System.Security.Cryptography;
using System.Text;

namespace PMAS_CITI.Services
{
    public class UserService
    {
        private readonly PMASCITIDbContext _context;

        public UserService(PMASCITIDbContext context)
        {
            _context = context;
        }

        public int InsertUser(User user)
        {
            _context.Users.Add(user);
            return _context.SaveChanges();
        }

        public User? GetUserByEmail(string email)
        {
            return _context.Users.SingleOrDefault(x => x.Email == email);
        }

        public User? GetUserById(string id)
        {
            return _context.Users.SingleOrDefault(x => x.Id.ToString() == id); 
        }

        public static bool IsPasswordMatch(string plaintext, string ciphertext)
        {
            return HashPassword(plaintext) == ciphertext;
        }
        
        public static string HashPassword(string plaintext)
        {
            using MD5 md5Hash = MD5.Create();
            byte[] data = md5Hash.ComputeHash(Encoding.UTF8.GetBytes(plaintext));
            StringBuilder sBuilder = new();

            for (int i = 0; i < data.Length; i++)
            {
                sBuilder.Append(data[i].ToString("x2"));
            }
            return sBuilder.ToString();
        }
    }
}
