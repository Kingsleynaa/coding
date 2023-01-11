using Microsoft.AspNetCore.Mvc;
using PMAS_CITI.Models;
using PMAS_CITI.Services;

namespace PMAS_CITI.Controllers;

[Route("api/seed-data")]
[ApiController]
public class SeedDataController : ControllerBase
{
    public SeedDataController(PMASCITIDbContext context)
    {
        _context = context;
    }

    private PMASCITIDbContext _context { get; }

    [HttpGet("admin")]
    public IActionResult InsertAdminAccount()
    {
        _context.Users.Add(new User
        {
            Id = Guid.Parse("00000000000000000000000000000000"),
            PlatformRoleId = Guid.Parse("00000000000000000000000000000000"),
            Email = "200600M@mymail.nyp.edu.sg",
            HashedPassword = UserService.HashPassword("password"),
            FullName = "Admin",
            DateCreated = DateTime.Now
        });

        int recordsChanged = _context.SaveChanges();

        return Ok(recordsChanged > 0
            ? "Admin account have been inserted into the database"
            : "Admin acconut already exists in the database");
    }

    [HttpGet("generic-users")]
    public IActionResult InsertGenericUsers()
    {
        _context.Users.AddRange(new User
            {
                Id = Guid.Parse("00000000000000000000000000000001"),
                PlatformRoleId = Guid.Parse("00000000000000000000000000000002"),
                Email = "peepeehuman@gmail.com",
                HashedPassword = UserService.HashPassword("password"),
                FullName = "Ethan Ng",
                DateCreated = DateTime.Now
            },
            new User()
            {
                Id = Guid.Parse("00000000000000000000000000000002"),
                PlatformRoleId = Guid.Parse("00000000000000000000000000000002"),
                Email = "keith@keith.com",
                HashedPassword = UserService.HashPassword("password"),
                FullName = "Keith Kng",
                DateCreated = DateTime.Now
            },
            new User()
            {
                Id = Guid.Parse("00000000000000000000000000000003"),
                PlatformRoleId = Guid.Parse("00000000000000000000000000000002"),
                Email = "leland@leland.com",
                HashedPassword = UserService.HashPassword("password"),
                FullName = "Leland Tan",
                DateCreated = DateTime.Now
            },
            new User()
            {
                Id = Guid.Parse("00000000000000000000000000000009"),
                PlatformRoleId = Guid.Parse("00000000000000000000000000000002"),
                HashedPassword = UserService.HashPassword("password"),
                DateCreated = DateTime.Now,
                Email = "jiahui@jiahui.com",
                FullName = "Lim Jia Hui"
            },
            new User()
            {
                Id = Guid.Parse("00000000000000000000000000000010"),
                PlatformRoleId = Guid.Parse("00000000000000000000000000000002"),
                HashedPassword = UserService.HashPassword("password"),
                DateCreated = DateTime.Now,
                Email = "elson@elson.com",
                FullName = "Elson Wong"
            },
            new User()
            {
                Id = Guid.Parse("00000000000000000000000000000011"),
                PlatformRoleId = Guid.Parse("00000000000000000000000000000002"),
                HashedPassword = UserService.HashPassword("password"),
                DateCreated = DateTime.Now,
                Email = "kayyi@kayyi.com",
                FullName = "Kay Yi"
            },
            new User()
            {
                Id = Guid.Parse("00000000000000000000000000000012"),
                PlatformRoleId = Guid.Parse("00000000000000000000000000000002"),
                HashedPassword = UserService.HashPassword("password"),
                DateCreated = DateTime.Now,
                Email = "theresa@theresa.com",
                FullName = "Theresa Chan"
            },
            new User()
            {
                Id = Guid.Parse("00000000000000000000000000000013"),
                PlatformRoleId = Guid.Parse("00000000000000000000000000000002"),
                HashedPassword = UserService.HashPassword("password"),
                DateCreated = DateTime.Now,
                Email = "teckang@teckang.com",
                FullName = "Ong Teck Ang"
            },
            new User()
            {
                Id = Guid.Parse("00000000000000000000000000000014"),
                PlatformRoleId = Guid.Parse("00000000000000000000000000000002"),
                HashedPassword = UserService.HashPassword("password"),
                DateCreated = DateTime.Now,
                Email = "huiqi@huiqi.com",
                FullName = "Tay Hui Qi"
            },
            new User()
            {
                Id = Guid.Parse("00000000000000000000000000000015"),
                PlatformRoleId = Guid.Parse("00000000000000000000000000000002"),
                HashedPassword = UserService.HashPassword("password"),
                DateCreated = DateTime.Now,
                Email = "jiayi@jiayi.com",
                FullName = "Xie Jia Yi"
            },
            new User()
            {
                Id = Guid.Parse("00000000000000000000000000000016"),
                PlatformRoleId = Guid.Parse("00000000000000000000000000000002"),
                HashedPassword = UserService.HashPassword("password"),
                DateCreated = DateTime.Now,
                Email = "jiaxuan@jiaxuan.com",
                FullName = "Lai Jia Xuan"
            },
            new User()
            {
                Id = Guid.Parse("00000000000000000000000000000017"),
                PlatformRoleId = Guid.Parse("00000000000000000000000000000002"),
                HashedPassword = UserService.HashPassword("password"),
                DateCreated = DateTime.Now,
                Email = "dennis@dennis.com",
                FullName = "Dennis Ng"
            },
            new User()
            {
                Id = Guid.Parse("00000000000000000000000000000018"),
                PlatformRoleId = Guid.Parse("00000000000000000000000000000002"),
                HashedPassword = UserService.HashPassword("password"),
                DateCreated = DateTime.Now,
                Email = "choonkiat@choonkia.com",
                FullName = "Lim Choon Kiat"
            },
            new User()
            {
                Id = Guid.Parse("00000000000000000000000000000019"),
                PlatformRoleId = Guid.Parse("00000000000000000000000000000002"),
                HashedPassword = UserService.HashPassword("password"),
                DateCreated = DateTime.Now,
                Email = "jovan@jovan.com",
                FullName = "Jovan Choi"
            },
            new User()
            {
                Id = Guid.Parse("00000000000000000000000000000020"),
                PlatformRoleId = Guid.Parse("00000000000000000000000000000002"),
                HashedPassword = UserService.HashPassword("password"),
                DateCreated = DateTime.Now,
                Email = "reiko@reiko.com",
                FullName = "Reiko Siew"
            }
        );

        int recordsChanged = _context.SaveChanges();

        return Ok(recordsChanged > 0
            ? "Generic accounts have been inserted into the database"
            : "Generic accounts already exist in the database");
    }

    [HttpGet("platform-roles")]
    public IActionResult InsertDefaultPlatformRoles()
    {
        _context.PlatformRoles.AddRange(new PlatformRole
            {
                Id = Guid.Parse("00000000000000000000000000000000"),
                Name = "Admin"
            },
            new PlatformRole
            {
                Id = Guid.Parse("00000000000000000000000000000001"),
                Name = "Project Manager"
            },
            new PlatformRole
            {
                Id = Guid.Parse("00000000000000000000000000000002"),
                Name = "User"
            });

        int recordsChanged = _context.SaveChanges();

        return Ok(recordsChanged > 0
            ? "Default roles have been inserted into the database"
            : "Roles already exist in the database");
    }

    [HttpGet("project-roles")]
    public IActionResult InsertDefaultProjectRoles()
    {
        _context.ProjectRoles.AddRange(new ProjectRole()
            {
                Id = Guid.Parse("00000000000000000000000000000000"),
                Name = "Project Lead"
            },
            new ProjectRole()
            {
                Id = Guid.Parse("00000000000000000000000000000001"),
                Name = "Developer"
            },
            new ProjectRole()
            {
                Id = Guid.Parse("00000000000000000000000000000002"),
                Name = "Creator"
            });

        int recordsChanged = _context.SaveChanges();

        return Ok(recordsChanged > 0
            ? "Default roles have been inserted into the database"
            : "Roles already exist in the database");
    }

    [HttpGet("requirement-types")]
    public IActionResult InsertDefaultRequirementTypes()
    {
        _context.ProjectRequirementTypes.AddRange(new ProjectRequirementType()
            {
                Id = Guid.Parse("00000000000000000000000000000000"),
                Name = "Hardware"
            },
            new ProjectRequirementType()
            {
                Id = Guid.Parse("00000000000000000000000000000001"),
                Name = "Software"
            }
        );

        int recordsChanged = _context.SaveChanges();

        return Ok(recordsChanged > 0
            ? "Default requirement types have been inserted into the database"
            : "Requirement types already exist in the database");
    }

    [HttpGet("risk-severities")]
    public IActionResult InsertDefaultRiskSeverities()
    {
        _context.RiskSeverities.AddRange(new RiskSeverity()
            {
                Id = Guid.Parse("00000000000000000000000000000003"),
                Name = "Low"
            },
            new RiskSeverity()
            {
                Id = Guid.Parse("00000000000000000000000000000004"),
                Name = "Medium"
            },
            new RiskSeverity()
            {
                Id = Guid.Parse("00000000000000000000000000000005"),
                Name = "High"
            }
        );

        int recordsChanged = _context.SaveChanges();

        return Ok(recordsChanged > 0
            ? "Default risk severities have been inserted into the database"
            : "Risk severities already exist in the database");
    }

    [HttpGet("risk-likelihoods")]
    public IActionResult InsertDefaultRiskLikelihood()
    {
        _context.RiskLikelihoods.AddRange(new RiskLikelihood()
            {
                Id = Guid.Parse("00000000000000000000000000000006"),
                Name = "Low"
            },
            new RiskLikelihood()
            {
                Id = Guid.Parse("00000000000000000000000000000007"),
                Name = "Medium"
            },
            new RiskLikelihood()
            {
                Id = Guid.Parse("00000000000000000000000000000008"),
                Name = "High"
            }
        );

        int recordsChanged = _context.SaveChanges();

        return Ok(recordsChanged > 0
            ? "Default risk likelihoods have been inserted into the database"
            : "Risk likelihoods already exist in the database");
    }

    [HttpGet("risk-categories")]
    public IActionResult InsertDefaultRiskCategories()
    {
        _context.RiskCategories.AddRange(new RiskCategory()
            {
                Id = Guid.Parse("00000000000000000000000000000009"),
                Name = "Technology",
                Definition =
                    "The technology required is not available or at its initial stages. E.g. hardware and software limitations."
            },
            new RiskCategory()
            {
                Id = Guid.Parse("00000000000000000000000000000010"),
                Name = "Business",
                Definition =
                    "Insufficient resources working for the project. E.g. resource turnover, resources fail to support project, resources becoming disengaged with the project, conflict between resources & stakeholders, etc."
            }
        );

        int recordsChanged = _context.SaveChanges();

        return Ok(recordsChanged > 0
            ? "Default risk categories have been inserted into the database"
            : "Risk categories already exist in the database");
    }

    [HttpGet("document-types")]
    public IActionResult InsertDefaultDocumentTypes()
    {
        _context.ProjectDocumentTypes.AddRange(new ProjectDocumentType()
            {
                Id = Guid.Parse("00000000000000000000000000000011"),
                Name = "Solutions Design",
            }, new ProjectDocumentType()
            {
                Id = Guid.Parse("00000000000000000000000000000012"),
                Name = "Documentations",
            }, new ProjectDocumentType()
            {
                Id = Guid.Parse("00000000000000000000000000000013"),
                Name = "Code Scan Status",
            }
        );

        int recordsChanged = _context.SaveChanges();

        return Ok(recordsChanged > 0
            ? "Default document types have been inserted into the database"
            : "Document types already exist in the database");
    }

    [HttpGet("notification-categories")]
    public IActionResult InsertDefaultNotificationCategories()
    {
        _context.NotificationCategories.AddRange(
            new NotificationCategory()
            {
                Id = Guid.Parse("00000000000000000000000000000014"),
                Name = "Project completion overdue.",
                Message = "has completion that is overdue."
            },
            new NotificationCategory()
            {
                Id = Guid.Parse("00000000000000000000000000000015"),
                Name = "Project not updated recently.",
                Message = "has not been updated for the past 2 months."
            },
            new NotificationCategory()
            {
                Id = Guid.Parse("00000000000000000000000000000016"),
                Name = "Milestone payment overdue.",
                Message = "has payment that are overdue."
            },
            new NotificationCategory()
            {
                Id = Guid.Parse("00000000000000000000000000000017"),
                Name = "Milestone completion overdue",
                Message = "has completion that is overdue."
                
            }
        );
        
        int recordsChanged = _context.SaveChanges();

        return Ok(recordsChanged > 0
            ? "Default notification categories have been inserted into the database"
            : "Notification categories already exist in the database");
    }
}