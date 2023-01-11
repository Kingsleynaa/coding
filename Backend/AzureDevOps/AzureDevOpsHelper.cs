using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using PMAS_CITI.AzureDevOps.Models;
using PMAS_CITI.AzureDevOps.Models.Commit;
using PMAS_CITI.AzureDevOps.Models.Repository;
using PMAS_CITI.Enums;
using PMAS_CITI.Models;
using PMAS_CITI.Services;
using Humanizer;
using Microsoft.AspNetCore.Mvc;



namespace PMAS_CITI.AzureDevOps;

public class AzureDevOpsHelper
{
    private readonly IConfiguration _configuration;
    private readonly ProjectService _projectService;
    private readonly MilestoneService _milestoneService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly RiskService _riskService;

    readonly string ORG_URL;
    readonly string ACCESS_TOKEN;

    public AzureDevOpsHelper(IConfiguration configuration, ProjectService projectService, MilestoneService milestoneService, IHttpContextAccessor httpContextAccessor, RiskService riskService)
    {
        _configuration = configuration;
        ORG_URL = $"https://dev.azure.com/{_configuration.GetValue<string>("AzureDevOps:Organization")}/";
        ACCESS_TOKEN = _configuration.GetValue<string>("AzureDevOps:PAS");
        _projectService = projectService;
        _milestoneService = milestoneService;
        _httpContextAccessor = httpContextAccessor;
        _riskService = riskService;


    }

    public async Task<AzureProjectList?> GetProjects()
    {
        string PAS = _configuration["AzureDevOps:PAS"];
        string organization = _configuration["AzureDevOps:Organization"];

        try
        {
            using (HttpClient client = new HttpClient())
            {
                client.DefaultRequestHeaders.Accept.Add(
                    new MediaTypeWithQualityHeaderValue("application/json"));

                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic",
                    Convert.ToBase64String(
                        System.Text.Encoding.ASCII.GetBytes(
                            string.Format("{0}:{1}", "", PAS))));

                using (HttpResponseMessage response = await client.GetAsync(
                           $"https://dev.azure.com/{organization}/_apis/projects"))
                {
                    response.EnsureSuccessStatusCode();
                    string? responseBody = await response.Content.ReadAsStringAsync();

                    JsonSerializerOptions options = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    };
                    AzureProjectList? projectList = JsonSerializer.Deserialize<AzureProjectList>(responseBody, options);
                    return projectList;
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.ToString());
        }

        return null;
    }

    public async Task<AzureCommitList?> GetCommitsForProject(string projectName, string repositoryName, int take = 0, int skip = 0)
    {
        string PAS = _configuration["AzureDevOps:PAS"];
        string organization = _configuration["AzureDevOps:Organization"];

        try
        {
            using (HttpClient client = new HttpClient())
            {
                client.DefaultRequestHeaders.Accept.Add(
                    new MediaTypeWithQualityHeaderValue("application/json"));

                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic",
                    Convert.ToBase64String(
                        System.Text.Encoding.ASCII.GetBytes(
                            string.Format("{0}:{1}", "", PAS))));

                string sizeQuery = "";
                if (take > 0)
                {
                    sizeQuery = $"searchCriteria.$top={take}";
                }

                using (HttpResponseMessage response = await client.GetAsync(
                           $"https://dev.azure.com/NanyangPoly/{projectName}/_apis/git/repositories/{repositoryName}/commits?api-version=6.0&{sizeQuery}&searchCriteria.$skip={skip * take}&searchCriteria.showOldestCommitsFirst=false"))
                {
                    response.EnsureSuccessStatusCode();
                    string? responseBody = await response.Content.ReadAsStringAsync();

                    JsonSerializerOptions options = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    };
                    AzureCommitList? projectList = JsonSerializer.Deserialize<AzureCommitList>(responseBody, options);
                    return projectList;
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.ToString());
        }

        return null;
    }

    public async Task<AzureRepositoryList?> GetRepositoriesForProject(string projectId)
    {
        string PAS = _configuration["AzureDevOps:PAS"];
        string organization = _configuration["AzureDevOps:Organization"];

        try
        {
            using (HttpClient client = new HttpClient())
            {
                client.DefaultRequestHeaders.Accept.Add(
                    new MediaTypeWithQualityHeaderValue("application/json"));

                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic",
                    Convert.ToBase64String(
                        System.Text.Encoding.ASCII.GetBytes(
                            string.Format("{0}:{1}", "", PAS))));

                using (HttpResponseMessage response = await client.GetAsync(
                           $"https://dev.azure.com/{organization}/{projectId}/_apis/git/repositories"))
                {
                    response.EnsureSuccessStatusCode();
                    string? responseBody = await response.Content.ReadAsStringAsync();

                    JsonSerializerOptions options = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    };
                    AzureRepositoryList? projectList = JsonSerializer.Deserialize<AzureRepositoryList>(responseBody, options);
                    return projectList;
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.ToString());
        }

        return null;
    }
    public async Task<List<T>?> AzureDevOpsListRequest<T>(string requestUrl)
    {
        string tokenFormat = string.Format("{0}:{1}", "", ACCESS_TOKEN);
        string credentials = Convert.ToBase64String(Encoding.ASCII.GetBytes(tokenFormat));

        using (HttpClient client = new HttpClient())
        {
            // Formatting base address for request
            string uri = ORG_URL;

            client.BaseAddress = new Uri(uri);
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);

            HttpResponseMessage response = await client.GetAsync(requestUrl);

            if (response.IsSuccessStatusCode)
            {
                List<T> returnList = new List<T>();
                string result = await response.Content.ReadAsStringAsync();
                List<T> valueList = JsonSerializer.Deserialize<AzureDevOpsListResponse<T>>(result)!.Value;
                return valueList;
            }

            return null;
        }
    }
    public async Task<T?> AzureDevOpsGetRequest<T>(string requestUrl)
    {
        string tokenFormat = string.Format("{0}:{1}", "", ACCESS_TOKEN);
        string credentials = Convert.ToBase64String(Encoding.ASCII.GetBytes(tokenFormat));

        using (HttpClient client = new HttpClient())
        {
            // Formatting base address for request
            string uri = ORG_URL;

            client.BaseAddress = new Uri(uri);
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);

            HttpResponseMessage response = await client.GetAsync(requestUrl);

            if (response.IsSuccessStatusCode)
            {
                string result = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<T>(result);
            }

            return default;
        }
    }
    public async Task<HttpResponseMessage> AzureDevOpsPutRequest(string requestUrl, HttpContent content)
    {
        string tokenFormat = string.Format("{0}:{1}", "", ACCESS_TOKEN);
        string credentials = Convert.ToBase64String(Encoding.ASCII.GetBytes(tokenFormat));

        using (HttpClient client = new HttpClient())
        {
            // Formatting base address for request
            string uri = ORG_URL;

            client.BaseAddress = new Uri(uri);
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);

            return await client.PutAsync(requestUrl, content);
        }
    }

    //NEW TEXT 
    public async Task<List<AzureDevOpsWiki>> ListWikis(string projectId)
    {
        return await AzureDevOpsListRequest<AzureDevOpsWiki>($"{projectId}/_apis/wiki/wikis") ?? new List<AzureDevOpsWiki>();
    }

    public StringContent GenerateReportStringContent(Project project)
    {
        DateTime generatedDateTime = DateTime.Now;

        // Members

        string membersTableData = "";
        List<ProjectMember> members = _projectService.QueryProjectMembers(project.Id.ToString(), null, null);
        foreach (ProjectMember member in members)
        {
            string title = member.ProjectRole.Id.ToString() == _configuration.GetValue<string>("RoleIds:ProjectManagerLocalRoleId") || member.ProjectRole.Id.ToString() == _configuration.GetValue<string>("RoleIds:ProjectLeadRoleId") ? $"<span style='font-weight: 600'>{member.ProjectRole.Name}</span>" : member.ProjectRole.Name;
            membersTableData += $"| {member.User.FullName} | {member.User.Email} | {title} |\n";
        }

        // Milestones

        int projectMonths = (int)Math.Round(project.DateProjectedEnd.Subtract(project.DateProjectedStart).Days / (365.2425 / 12));
        List<ProjectMilestone> milestones = _milestoneService.GetAllMilestonesForProject(project.Id.ToString());

        string milestoneTable = "";
        string milestonesGanttChart = "";

        if (milestones.Count() > 0)
        {
            foreach (ProjectMilestone milestone in milestones.OrderBy(m => m.DateProjectedStart))
            {
                string milestoneHighlight = "";
                

                if (_milestoneService.GetMilestoneStatus(milestone) == MilestoneStatus.OVERDUE_COMPLETION || _milestoneService.GetMilestoneStatus(milestone) == MilestoneStatus.OVERDUE_PAYMENT)
                {
                    milestoneHighlight = " style='background-color: #ff8d85'";
                }
                else if (_milestoneService.GetMilestoneStatus(milestone) == MilestoneStatus.PAID)
                {
                    milestoneHighlight = " style='background-color: #bcf79e'";
                }

                string tasks = "";
                if (milestone.ProjectTasks.Count() > 0)
                {
                    tasks += "<ul>\n";
                    foreach (ProjectTask task in milestone.ProjectTasks)
                    {
                        tasks += $"<li>{task.Name}</li>\n";
                    }
                    tasks += "</ul>";
                }
                else
                {
                    tasks = "This milestone has no tasks";
                }
                milestoneTable += $@"<tr{milestoneHighlight}>
<td>{milestone.Name}</td>
<td>{_milestoneService.GetMilestoneStatus(milestone)}</td>
<td>{milestone.DateProjectedStart.ToString("dd MMMM yyyy")} - {milestone.DateProjectedEnd.ToString("dd MMMM yyyy")} ({(milestone.DateProjectedEnd.Date - milestone.DateProjectedStart.Date).Days} days)</td>
<td>
{tasks}
</td>
<td>{milestone.PaymentPercentage}% (${_milestoneService.GetMilestonePaymentAmountString(milestone.PaymentPercentage!, (double)project.PaymentAmount)})</td>
</tr>
";
            }

            // Milestones gantt chart
            string milestonesGanttChartData = "";

            foreach (MilestoneStatus status in Enum.GetValues(typeof(MilestoneStatus)))
            {
                milestonesGanttChartData += $"section {status.ToString()}\n";
                foreach (ProjectMilestone milestone in milestones.Where(m => _milestoneService.GetMilestoneStatus(m) == status).OrderBy(m => m.DateProjectedStart))
                {
                    milestonesGanttChartData += $"{milestone.Name} : {milestone.DateProjectedStart.ToString("yyyy-MM-dd")}, {milestone.DateProjectedEnd.ToString("yyyy-MM-dd")}\n";
                }
                milestonesGanttChartData += "\n";
            }

            milestonesGanttChart = @$"::: mermaid
gantt
    title Projected Timeline ({projectMonths} Months)
    axisFormat  Week %W

    {milestonesGanttChartData}
:::";
        }
        else
        {
            milestoneTable = @"<tr>
<td colspan='5' style='text-align:center'>There are no milestones</td>
</tr>";
        }

        List<ProjectMilestone> paymentOverdueMilestones = milestones.Where(m => _milestoneService.GetMilestoneStatus(m) == MilestoneStatus.OVERDUE_PAYMENT).ToList();
        List<ProjectMilestone> lateMilestones = milestones.Where(m => _milestoneService.GetMilestoneStatus(m) == MilestoneStatus.OVERDUE_COMPLETION).ToList();

        int notStartedMilestoneCount = milestones.Where(m => _milestoneService.GetMilestoneStatus(m) == MilestoneStatus.NOT_STARTED).Count();
        int onGoingMilestoneCount = milestones.Where(m => _milestoneService.GetMilestoneStatus(m) == MilestoneStatus.ONGOING).Count();
        int awaitingPaymentMilestoneCount = milestones.Where(m => _milestoneService.GetMilestoneStatus(m) == MilestoneStatus.AWAITING_PAYMENT).Count();
        int completedMilestoneCount = milestones.Where(m => _milestoneService.GetMilestoneStatus(m) == MilestoneStatus.PAID).Count();

        int lateMilestoneListCount = 1;
        string lateMilestoneList = "";
        if (lateMilestones.Count() > 0)
        {
            string lateMilestoneListData = "";
            foreach (ProjectMilestone milestone in lateMilestones)
            {
                lateMilestoneListData += $"{lateMilestoneListCount}. <h3>{milestone.Name}</h3>\n";
                lateMilestoneListData += $"   <p>Projected Completion Date: <span style='font-weight: 600'>{milestone.DateProjectedEnd.ToString("dd MMM yyyy")} ({milestone.DateProjectedEnd.Humanize(utcDate: false)})</span></p>\n\n";
                
                lateMilestoneListCount++;
            }

            lateMilestoneList = $@"<details>
<summary style='font-weight: 600; font-size: 1.0625rem'>Late Milestones</summary>

{lateMilestoneListData}
</details>";
        }

        int paymentOverdueMilestoneListCount = 1;
        string paymentOverdueMilestoneList = "";
        if (paymentOverdueMilestones.Count() > 0)
        {
            string paymentOverdueMilestoneListData = "";
            foreach (ProjectMilestone milestone in paymentOverdueMilestones)
            {
                paymentOverdueMilestoneListData += $"{paymentOverdueMilestoneListCount}. <h3>{milestone.Name}</h3>\n\n";
                paymentOverdueMilestoneListData += $"   - Payment Percentage: <span style='font-weight: 600'>{milestone.PaymentPercentage}% (${_milestoneService.GetMilestonePaymentAmountString(milestone.PaymentPercentage!, (double)project.PaymentAmount)})</span>\n";
                paymentOverdueMilestoneListData += $"   - Milestone Completion Date: <span style='font-weight: 600'>{milestone.DateActualEnd!.Value.ToString("dd MMM yyyy")} ({milestone.DateActualEnd!.Value.Humanize(utcDate: false)})</span>\n";
                lateMilestoneListCount++;
            }

            paymentOverdueMilestoneList = $@"<details style='margin-top: 20px;'>
<summary style='font-weight: 600; font-size: 1.0625rem'>Payment Overdue Milestones</summary>

{paymentOverdueMilestoneListData}
</details>";
        }

        // Requirements
        string requirementsTable = "";
        List<ProjectRequirement> hardwareRequirements = _projectService.GetAllHardwareRequirementsForProject(project.Id.ToString());
        List<ProjectRequirement> softwareRequirements = _projectService.GetAllSoftwareRequirementsForProject(project.Id.ToString());
        if (hardwareRequirements.Count() + softwareRequirements.Count() > 0)
        {
            foreach (ProjectRequirement hardwareRequirement in hardwareRequirements)
            {
                requirementsTable += $@"
<tr>
<td>{hardwareRequirement.Name}</td>
<td>{RequirementType.Hardware}</td>
<td>{hardwareRequirement.Description}</td>
</tr>";
            }

            foreach (ProjectRequirement softwareRequirement in softwareRequirements)
            {
               
                requirementsTable += $@"<tr>
<td>{softwareRequirement.Name}</td>
<td>{RequirementType.Software}</td>
<td>{softwareRequirement.Description}</td>
</tr>";
            }
        }
        else
        {
            requirementsTable = @"<tr>
<td colspan='3' style='text-align:center'>There are no requirements</td>
</tr>";
        }

        // Risks
        string risksTable = "";
        List<ProjectRisk> risks = _riskService.QueryRisks(project.Id.ToString());
        if (risks.Count() > 0)
        {
            foreach (ProjectRisk risk in risks)
            {
                risksTable += $@"<tr>

<td>
<p style='font-weight: 600; margin: 0 0 10px 0'>{risk.RiskCategory.Name}</p>
</td>

<td>{risk.Description}</td>
<td>{risk.RiskSeverity.Name}</td>
<td>{risk.RiskLikelihood.Name}</td>
<td>{risk.Mitigation}</td>
</tr>";
            }
        }
        else
        {
            risksTable = @"<tr>
<td colspan='6' style='text-align:center'>There are no risks</td>
</tr>";
        }

        // Documents


        ProjectDocument? codeScanStatus = _projectService.GetDocumentsForProject(project.Id.ToString(), "00000000-0000-0000-0000-000000000013").FirstOrDefault();
        string codeScanStatusString = codeScanStatus != null ? $"<a href='{_httpContextAccessor.HttpContext.Request.Scheme}://{_httpContextAccessor.HttpContext.Request.Host}/api/projects/download-file?documentId={codeScanStatus.Id}' download>{codeScanStatus.FileName}</a>" : "<p style='text-align: center; margin: 0 0 0 0'>-</p>";

        ProjectDocument? solutionArchitecture = _projectService.GetDocumentsForProject(project.Id.ToString(), "00000000-0000-0000-0000-000000000011").FirstOrDefault();
        string solutionArchitectureString = solutionArchitecture != null ? $"<a href='{_httpContextAccessor.HttpContext.Request.Scheme}://{_httpContextAccessor.HttpContext.Request.Host}/api/projects/download-file?documentId={solutionArchitecture.Id}' download>{solutionArchitecture.FileName}</a>" : "<p style='text-align: center; margin: 0 0 0 0'>-</p>";

        ProjectDocument? documentation = _projectService.GetDocumentsForProject(project.Id.ToString(), "00000000-0000-0000-0000-000000000012").FirstOrDefault();
        string documentationString = documentation != null ? $"<a href='{_httpContextAccessor.HttpContext.Request.Scheme}://{_httpContextAccessor.HttpContext.Request.Host}/api/projects/download-file?documentId={documentation.Id}' download>{documentation.FileName}</a>" : "<p style='text-align: center; margin: 0 0 0 0'>-</p>";

        string reportContent = @$"<h1>Project Report for {project.Name}</h1>
<p style='margin: 0 0 10px 0'>Generated on: <span style='font-weight: 600'>{generatedDateTime.ToString("dd MMM yyyy, h:mm")} {generatedDateTime.ToString("tt").ToUpper()}</span></p>

<p>Project Value: <span style='font-weight: 600'>${project.PaymentAmount.ToString()}</span></p>


[[_TOC_]]
## Members (Total: {members.Count()})
| Name | Email | Role |
|--|--|--|
{membersTableData}



## Milestones (Total: {milestones.Count()})

| Not Started | On Going | Awaiting Payment | Payment Overdue | Late | Completed |
|--|--|--|--|--|--|
| {notStartedMilestoneCount} | {onGoingMilestoneCount} | {awaitingPaymentMilestoneCount} | {paymentOverdueMilestones.Count()} | {lateMilestones.Count()} | {completedMilestoneCount} |

{milestonesGanttChart}

<table>
<tr>
<th>Name</th>
<th>Status</th>
<th>Projected Duration</th>
<th>Tasks</th>
<th>Payment Percentage</th>
</tr>

{milestoneTable}

</table>

{lateMilestoneList}

{paymentOverdueMilestoneList}

## Requirements

<table>
<tr>
<th>Name</th>
<th>Type</th>
<th>Description</th>
</tr>

{requirementsTable}

</table>

## Risks

<table>
<tr>
<th>Category</th>
<th>Description</th>
<th>Severity</th>
<th>Likelihood</th>
<th>Mitigation</th>
</tr>

{risksTable}

</table>

## Documents

| Code Scan Status | Solution Architecture | Documentation |
|--|--|--|
| {codeScanStatusString} | {solutionArchitectureString} | {documentationString} |";
        string jsonContent = JsonSerializer.Serialize(new AzureDevOpsPagePutRequest
        {
            Content = reportContent
        });
        return new StringContent(jsonContent, Encoding.UTF8, "application/json");
    }

    public async Task<string?> GenerateReport(string projectId, StringContent reportContent)
    {
        List<AzureDevOpsWiki> wikis = await ListWikis(projectId);
        // Folder to store all reports, currently hardcoded
        string folder = "Reports";

        // Currently just targets first project wiki
        AzureDevOpsWiki? targetWiki = wikis.FirstOrDefault(w => w.Type == "projectWiki");

        if (targetWiki != null)
        {
            // Create folder in wiki if not already created
            await AzureDevOpsPutRequest($"{projectId}/_apis/wiki/wikis/{targetWiki.Id}/pages?path={folder}&api-version=6.0", new StringContent("", Encoding.UTF8, "application/json"));

            string reportName = $"{DateTime.Now.ToString("dd-MMM-yyyy, hh:mm")} {DateTime.Now.ToString("tt").ToUpper()}";
            HttpResponseMessage response = await AzureDevOpsPutRequest($"{projectId}/_apis/wiki/wikis/{targetWiki.Id}/pages?path={folder}/{reportName}&api-version=6.0", reportContent);
            if (response.IsSuccessStatusCode)
            {
                string result = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<AzureDevOpsPagePutResponse>(result)!.Url;
            }
        }
        return null;


    }

    public Task<HttpResponseMessage> WikiPutRequest(string projectId)
    {
        return null;

    }
}






