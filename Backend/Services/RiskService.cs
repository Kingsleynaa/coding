using PMAS_CITI.Enums;
using PMAS_CITI.Models;
using Microsoft.AspNetCore.Components.Forms;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using PMAS_CITI.Controllers;
using PMAS_CITI.QuartzConfig;
using PMAS_CITI.ResponseObjects;
using PMAS_CITI.Utils;
using Quartz;

using System.Linq;
using System.Configuration;

namespace PMAS_CITI.Services
{
    public class RiskService
    {
        private readonly PMASCITIDbContext _context;
        private ProjectService _projectService;
        private readonly NotificationService _notificationService;
        private readonly IConfiguration _configuration;

        
        public RiskService(PMASCITIDbContext context, ProjectService projectService, IConfiguration configuration)
        {
            _context = context;
            _projectService = projectService;
            _configuration = configuration;
        }

        public  List<ProjectRisk> QueryRisks(string projectId)
        {

 
            return _context.ProjectRisks
                .Include(r => r.RiskCategory)
                .Include(r => r.RiskSeverity)
                .Include(r => r.RiskLikelihood)
                .Where(r => r.Project.Id.ToString() == projectId)
                .ToList();

            
            
        }
       
    }
}
