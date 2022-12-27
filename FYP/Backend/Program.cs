using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PMAS_CITI.Models;
using PMAS_CITI.Services;
using System.Text;
using Microsoft.AspNetCore.SignalR;
using PMAS_CITI.AzureDevOps;
using PMAS_CITI.QuartzConfig;
using PMAS_CITI.SendGridConfig;
using PMAS_CITI.SignalRConfig;
using Quartz;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddDbContext<PMASCITIDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Demo1")));

builder.Services.AddTransient<UserService>();
builder.Services.AddTransient<ProjectService>();
builder.Services.AddTransient<MilestoneService>();
builder.Services.AddTransient<TaskService>();
builder.Services.AddTransient<ProjectMemberService>();
builder.Services.AddTransient<NotificationService>();
builder.Services.AddTransient<FileService>();
builder.Services.AddTransient<EmailService>();
builder.Services.AddTransient<RiskService>();

builder.Services.AddTransient<Scheduler>();
builder.Services.AddTransient<MailSender>();
builder.Services.AddTransient<AzureDevOpsHelper>();

builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddHttpContextAccessor();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters()
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        RequireExpirationTime = true,
        ValidateLifetime = true,
        ValidAudience = builder.Configuration["Jwt:Audience"],
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        NameClaimType = "user_id",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
    };

    options.Events = new JwtBearerEvents()
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];

            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && (path.StartsWithSegments("/hubs/notifications")))
            {
                context.Token = accessToken;
            }

            return Task.CompletedTask;
        }
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("APIPolicy", options =>
    {
        options.WithOrigins("https://localhost:3000", "http://localhost:3000")
            .AllowAnyHeader()
            .AllowCredentials()
            .WithOrigins("http://localhost:3000", "https://localhost:3000")
            .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllersWithViews()
    .AddJsonOptions(options =>
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles
);
builder.Services.AddQuartz(q => { q.UseMicrosoftDependencyInjectionJobFactory(); });

builder.Services.AddQuartzHostedService(q =>
    q.WaitForJobsToComplete = true
);

var app = builder.Build();

app.UseCors("APIPolicy");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();