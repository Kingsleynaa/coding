using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace PMAS_CITI.Models
{
    public partial class PMASCITIDbContext : DbContext
    {
        public PMASCITIDbContext()
        {
        }

        public PMASCITIDbContext(DbContextOptions<PMASCITIDbContext> options)
            : base(options)
        {
        }

        public virtual DbSet<CommitHistory> CommitHistories { get; set; } = null!;
        public virtual DbSet<EmailTemplate> EmailTemplates { get; set; } = null!;
        public virtual DbSet<Notification> Notifications { get; set; } = null!;
        public virtual DbSet<NotificationCategory> NotificationCategories { get; set; } = null!;
        public virtual DbSet<NotificationLog> NotificationLogs { get; set; } = null!;
        public virtual DbSet<PlatformRole> PlatformRoles { get; set; } = null!;
        public virtual DbSet<Project> Projects { get; set; } = null!;
        public virtual DbSet<ProjectDocument> ProjectDocuments { get; set; } = null!;
        public virtual DbSet<ProjectDocumentType> ProjectDocumentTypes { get; set; } = null!;
        public virtual DbSet<ProjectMember> ProjectMembers { get; set; } = null!;
        public virtual DbSet<ProjectMemberTask> ProjectMemberTasks { get; set; } = null!;
        public virtual DbSet<ProjectMilestone> ProjectMilestones { get; set; } = null!;
        public virtual DbSet<ProjectRequirement> ProjectRequirements { get; set; } = null!;
        public virtual DbSet<ProjectRequirementType> ProjectRequirementTypes { get; set; } = null!;
        public virtual DbSet<ProjectRisk> ProjectRisks { get; set; } = null!;
        public virtual DbSet<ProjectRole> ProjectRoles { get; set; } = null!;
        public virtual DbSet<ProjectTask> ProjectTasks { get; set; } = null!;
        public virtual DbSet<RiskCategory> RiskCategories { get; set; } = null!;
        public virtual DbSet<RiskLikelihood> RiskLikelihoods { get; set; } = null!;
        public virtual DbSet<RiskSeverity> RiskSeverities { get; set; } = null!;
        public virtual DbSet<User> Users { get; set; } = null!;

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see http://go.microsoft.com/fwlink/?LinkId=723263.
                optionsBuilder.UseSqlServer("Data Source=(localdb)\\MSSQLLocalDB;Initial Catalog=PMAS_CITI;Integrated Security=True;Connect Timeout=30;Encrypt=False;TrustServerCertificate=False;ApplicationIntent=ReadWrite;MultiSubnetFailover=False");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<CommitHistory>(entity =>
            {
                entity.ToTable("CommitHistory");

                entity.Property(e => e.Id).HasDefaultValueSql("(newid())");

                entity.Property(e => e.CommitById).HasDefaultValueSql("(newid())");

                entity.Property(e => e.DateCommited).HasColumnType("datetime");

                entity.HasOne(d => d.CommitBy)
                    .WithMany(p => p.CommitHistories)
                    .HasForeignKey(d => d.CommitById)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_CommitHistory_Users");

                entity.HasOne(d => d.Project)
                    .WithMany(p => p.CommitHistories)
                    .HasForeignKey(d => d.ProjectId)
                    .HasConstraintName("FK_CommitHistory_Projects");
            });

            modelBuilder.Entity<EmailTemplate>(entity =>
            {
                entity.Property(e => e.Id).HasDefaultValueSql("(newid())");

                entity.Property(e => e.DateCreated).HasColumnType("datetime");

                entity.Property(e => e.DateUpdated).HasColumnType("datetime");

                entity.HasOne(d => d.NotificationCategory)
                    .WithMany(p => p.EmailTemplates)
                    .HasForeignKey(d => d.NotificationCategoryId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_EmailTemplates_NotificationCategories");
            });

            modelBuilder.Entity<Notification>(entity =>
            {
                entity.Property(e => e.Id).HasDefaultValueSql("(newid())");

                entity.Property(e => e.DateCreated).HasColumnType("datetime");

                entity.HasOne(d => d.Milestone)
                    .WithMany(p => p.Notifications)
                    .HasForeignKey(d => d.MilestoneId)
                    .HasConstraintName("FK_Notifications_ProjectMilestones");

                entity.HasOne(d => d.NotificationCategory)
                    .WithMany(p => p.Notifications)
                    .HasForeignKey(d => d.NotificationCategoryId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Notifications_NotificationCategories");

                entity.HasOne(d => d.Project)
                    .WithMany(p => p.Notifications)
                    .HasForeignKey(d => d.ProjectId)
                    .HasConstraintName("FK_Notifications_Projects");
            });

            modelBuilder.Entity<NotificationCategory>(entity =>
            {
                entity.Property(e => e.Id).ValueGeneratedNever();
            });

            modelBuilder.Entity<NotificationLog>(entity =>
            {
                entity.HasKey(e => new { e.NotificationId, e.UserId });

                entity.Property(e => e.DateCreated).HasColumnType("datetime");

                entity.HasOne(d => d.Notification)
                    .WithMany(p => p.NotificationLogs)
                    .HasForeignKey(d => d.NotificationId)
                    .HasConstraintName("FK_NotificationLogs_Notifications1");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.NotificationLogs)
                    .HasForeignKey(d => d.UserId)
                    .HasConstraintName("FK_NotificationLogs_Users");
            });

            modelBuilder.Entity<PlatformRole>(entity =>
            {
                entity.Property(e => e.Id).ValueGeneratedNever();
            });

            modelBuilder.Entity<Project>(entity =>
            {
                entity.Property(e => e.Id).HasDefaultValueSql("(newid())");

                entity.Property(e => e.DateActualEnd).HasColumnType("date");

                entity.Property(e => e.DateActualStart).HasColumnType("date");

                entity.Property(e => e.DateCreated).HasColumnType("datetime");

                entity.Property(e => e.DatePaid).HasColumnType("date");

                entity.Property(e => e.DateProjectedEnd).HasColumnType("date");

                entity.Property(e => e.DateProjectedStart).HasColumnType("date");

                entity.Property(e => e.DateUpdated).HasColumnType("datetime");

                entity.HasOne(d => d.CreatedyBy)
                    .WithMany(p => p.Projects)
                    .HasForeignKey(d => d.CreatedyById)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_Projects_Users");
            });

            modelBuilder.Entity<ProjectDocument>(entity =>
            {
                entity.Property(e => e.Id).HasDefaultValueSql("(newid())");

                entity.Property(e => e.DateUploaded).HasColumnType("datetime");

                entity.HasOne(d => d.DocumentType)
                    .WithMany(p => p.ProjectDocuments)
                    .HasForeignKey(d => d.DocumentTypeId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_ProjectDocuments_ProjectDocumentTypes");

                entity.HasOne(d => d.Project)
                    .WithMany(p => p.ProjectDocuments)
                    .HasForeignKey(d => d.ProjectId)
                    .HasConstraintName("FK_ProjectDocuments_Projects");

                entity.HasOne(d => d.UploadedByUser)
                    .WithMany(p => p.ProjectDocuments)
                    .HasForeignKey(d => d.UploadedByUserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_ProjectDocuments_Users");
            });

            modelBuilder.Entity<ProjectDocumentType>(entity =>
            {
                entity.Property(e => e.Id).ValueGeneratedNever();
            });

            modelBuilder.Entity<ProjectMember>(entity =>
            {
                entity.HasKey(e => new { e.ProjectId, e.UserId })
                    .HasName("PK_ProjectMembers_1");

                entity.Property(e => e.DateJoined).HasColumnType("datetime");

                entity.HasOne(d => d.Project)
                    .WithMany(p => p.ProjectMembers)
                    .HasForeignKey(d => d.ProjectId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_ProjectMembers_Projects");

                entity.HasOne(d => d.ProjectRole)
                    .WithMany(p => p.ProjectMembers)
                    .HasForeignKey(d => d.ProjectRoleId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_ProjectMembers_ProjectRoles");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.ProjectMembers)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_ProjectMembers_Users");
            });

            modelBuilder.Entity<ProjectMemberTask>(entity =>
            {
                entity.HasKey(e => new { e.ProjectId, e.TaskId, e.UserId })
                    .HasName("PK_Table_1");

                entity.Property(e => e.DateAssigned).HasColumnType("datetime");

                entity.HasOne(d => d.Task)
                    .WithMany(p => p.ProjectMemberTasks)
                    .HasForeignKey(d => d.TaskId)
                    .HasConstraintName("FK_Table_1_ProjectTasks");

                entity.HasOne(d => d.ProjectMember)
                    .WithMany(p => p.ProjectMemberTasks)
                    .HasForeignKey(d => new { d.ProjectId, d.UserId })
                    .HasConstraintName("FK_ProjectMemberTasks_ProjectMembers");
            });

            modelBuilder.Entity<ProjectMilestone>(entity =>
            {
                entity.Property(e => e.Id).HasDefaultValueSql("(newid())");

                entity.Property(e => e.DateActualEnd).HasColumnType("date");

                entity.Property(e => e.DateActualStart).HasColumnType("date");

                entity.Property(e => e.DateCreated).HasColumnType("datetime");

                entity.Property(e => e.DatePaid).HasColumnType("datetime");

                entity.Property(e => e.DateProjectedEnd).HasColumnType("date");

                entity.Property(e => e.DateProjectedStart).HasColumnType("date");

                entity.Property(e => e.DateUpdated).HasColumnType("datetime");

                entity.HasOne(d => d.Project)
                    .WithMany(p => p.ProjectMilestones)
                    .HasForeignKey(d => d.ProjectId)
                    .HasConstraintName("FK_ProjectMilestones_Projects");
            });

            modelBuilder.Entity<ProjectRequirement>(entity =>
            {
                entity.Property(e => e.Id).HasDefaultValueSql("(newid())");

                entity.HasOne(d => d.Project)
                    .WithMany(p => p.ProjectRequirements)
                    .HasForeignKey(d => d.ProjectId)
                    .HasConstraintName("FK_ProjectRequirements_Projects");

                entity.HasOne(d => d.RequirementType)
                    .WithMany(p => p.ProjectRequirements)
                    .HasForeignKey(d => d.RequirementTypeId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_ProjectRequirements_ProjectRequirementTypes");
            });

            modelBuilder.Entity<ProjectRequirementType>(entity =>
            {
                entity.Property(e => e.Id).ValueGeneratedNever();
            });

            modelBuilder.Entity<ProjectRisk>(entity =>
            {
                entity.Property(e => e.Id).HasDefaultValueSql("(newid())");

                entity.HasOne(d => d.Project)
                    .WithMany(p => p.ProjectRisks)
                    .HasForeignKey(d => d.ProjectId)
                    .HasConstraintName("FK_ProjectRisks_Projects");

                entity.HasOne(d => d.RiskCategory)
                    .WithMany(p => p.ProjectRisks)
                    .HasForeignKey(d => d.RiskCategoryId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_ProjectRisks_RiskCategories");

                entity.HasOne(d => d.RiskLikelihood)
                    .WithMany(p => p.ProjectRisks)
                    .HasForeignKey(d => d.RiskLikelihoodId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_ProjectRisks_RiskLikelihoods");

                entity.HasOne(d => d.RiskSeverity)
                    .WithMany(p => p.ProjectRisks)
                    .HasForeignKey(d => d.RiskSeverityId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_ProjectRisks_RiskSeverities");
            });

            modelBuilder.Entity<ProjectRole>(entity =>
            {
                entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            });

            modelBuilder.Entity<ProjectTask>(entity =>
            {
                entity.Property(e => e.Id).HasDefaultValueSql("(newid())");

                entity.Property(e => e.DateCreated).HasColumnType("datetime");

                entity.Property(e => e.DateUpdated).HasColumnType("datetime");

                entity.HasOne(d => d.Milestone)
                    .WithMany(p => p.ProjectTasks)
                    .HasForeignKey(d => d.MilestoneId)
                    .HasConstraintName("FK_ProjectTasks_ProjectMilestones");
            });

            modelBuilder.Entity<RiskCategory>(entity =>
            {
                entity.Property(e => e.Id).ValueGeneratedNever();
            });

            modelBuilder.Entity<RiskLikelihood>(entity =>
            {
                entity.Property(e => e.Id).ValueGeneratedNever();
            });

            modelBuilder.Entity<RiskSeverity>(entity =>
            {
                entity.Property(e => e.Id).ValueGeneratedNever();
            });

            modelBuilder.Entity<User>(entity =>
            {
                entity.Property(e => e.Id).HasDefaultValueSql("(newid())");

                entity.Property(e => e.DateCreated).HasColumnType("datetime");

                entity.HasOne(d => d.PlatformRole)
                    .WithMany(p => p.Users)
                    .HasForeignKey(d => d.PlatformRoleId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Users_PlatformRoles");
            });

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}
