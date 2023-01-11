using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using PMAS_CITI.Models;
using PMAS_CITI.RequestBodies;
using PMAS_CITI.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace PMAS_CITI.Controllers
{
    [Route("api/users")]
    [ApiController]
    [EnableCors("APIPolicy")]
    public class UserController : ControllerBase
    {
        private IConfiguration _configuration { get; set; }
        private UserService _userService { get; set; }
        private PMASCITIDbContext _context { get; set; }

        public UserController(IConfiguration configuration, UserService userService, PMASCITIDbContext context)
        {
            _configuration = configuration;
            _userService = userService;
            _context = context;
        }


        [Authorize]
        [HttpGet("{userId}")]
        public IActionResult GetUserInformationByUserId(string userId)
        {
            ClaimsIdentity? currentIdentity = HttpContext.User.Identity as ClaimsIdentity;
            if (currentIdentity.FindFirst("user_id").Value != userId)
            {
                return Forbid();
            }

            User? currentUser = _context.Users
                .Include(x => x.PlatformRole)
                .SingleOrDefault(x => x.Id == Guid.Parse(userId));
            if (currentUser == null)
            {
                return NotFound($"User with id {userId} does not exist.");
            }

            return Ok(new
            {
                UserId = currentUser.Id.ToString(),
                FullName = currentUser.FullName,
                Email = currentUser.Email,
                RoleId = currentUser.PlatformRoleId,
                RoleName = currentUser.PlatformRole.Name,
                DateCreated = currentUser.DateCreated,
            });
        }

        [HttpGet("{userId}/role")]
        public IActionResult GetUserRole(string userId)
        {
            User? currentUser = _context.Users
                .Include(x => x.PlatformRole)
                .SingleOrDefault(x => x.Id == Guid.Parse(userId));

            if (currentUser == null)
            {
                return NotFound($"User with id {userId} does not exist.");
            }

            PlatformRole role = _context.PlatformRoles
                .SingleOrDefault(x => x.Id == currentUser.PlatformRoleId);

            return Ok(new PlatformRole()
            {
                Id = role.Id,
                Name = role.Name,
            });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginForm loginForm)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest("Invalid login credentials.");
            }

            User currentUser = _userService.GetUserByEmail(loginForm.Email);
            if (currentUser == null || !UserService.IsPasswordMatch(loginForm.Password, currentUser.HashedPassword))
            {
                return Unauthorized("Invalid login credentials.");
            }

            var userClaims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Email, currentUser.Email),
                new Claim(JwtRegisteredClaimNames.GivenName, currentUser.FullName),
                new Claim(ClaimTypes.NameIdentifier, currentUser.Id.ToString()),
                new Claim("user_id", currentUser.Id.ToString()),
                new Claim("role", currentUser.PlatformRoleId.ToString())
            };

            SymmetricSecurityKey? key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            SigningCredentials? signIn = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var jwtToken = new JwtSecurityToken(
                _configuration["Jwt:Issuer"],
                _configuration["Jwt:Audience"],
                userClaims,
                expires: DateTime.Now.AddHours(3),
                signingCredentials: signIn
            );

            return Ok(new JwtSecurityTokenHandler().WriteToken(jwtToken));
        }

        [HttpPost("search")]
        public IActionResult GetUsers([FromBody] UserFilters filters)
        {
            var users = _context.Users
                .AsNoTracking()
                .Where(x => x.Email.Contains(filters.Query) || x.FullName.Contains(filters.Query))
                .Take(filters.ResultSize)
                .Skip(filters.ResultPage * filters.ResultSize)
                .Select(x => new
                    {
                        Value = x.Id,
                        Email = x.Email,
                        Name = x.FullName,
                        UserId = x.Id,
                    }
                )
                .ToList();

            users = users
                .Where(x => !filters.UserIdlist.Contains(x.UserId.ToString("D")))
                .ToList();

            return Ok(users);
        }
    }
}