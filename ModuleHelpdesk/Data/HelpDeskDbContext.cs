using Microsoft.EntityFrameworkCore;
using ModuleHelpDesk.Models;
using System.Text.Json;

namespace ModuleHelpDesk.Data
{
    public class HelpDeskDbContext : DbContext
    {
        public HelpDeskDbContext(DbContextOptions<HelpDeskDbContext> options)
            : base(options)
        {
        }

        public DbSet<Ticket> Tickets { get; set; }
        public DbSet<Intervention> Interventions { get; set; }
        public DbSet<InterventionExecution> InterventionExecutions { get; set; }
        public DbSet<TicketCollaborateur> TicketCollaborateurs { get; set; }
        public DbSet<MessageTicket> MessageTickets { get; set; }
        public DbSet<KnowledgeBase> KnowledgeBases { get; set; }
        public DbSet<KnowledgeSolution> KnowledgeSolutions { get; set; }
        public DbSet<TicketHistory> TicketHistories { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<UserCredential> UserCredentials { get; set; }

        public DbSet<Agent> Agents { get; set; }
        public DbSet<Company> Companies { get; set; }
        public DbSet<Contact> Contacts { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Ticket>()
                .Property(t => t.ImagesUrls)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                    v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions)null!) ?? new List<string>()
                );

            modelBuilder.Entity<KnowledgeSolution>()
                .Property(s => s.PiecesJointesUrls)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                    v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions)null!) ?? new List<string>()
                );

            modelBuilder.Entity<MessageTicket>(entity =>
            {
                entity.HasOne(m => m.Ticket)
                      .WithMany(t => t.Messages)
                      .HasForeignKey(m => m.TicketId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<KnowledgeSolution>()
                .HasOne<KnowledgeBase>()
                .WithMany(k => k.Solutions)
                .HasForeignKey(s => s.KnowledgeBaseId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Agent>()
                .Property(a => a.Id)
                .ValueGeneratedNever();

            // InterventionExecution
            modelBuilder.Entity<InterventionExecution>(e =>
            {
                e.HasOne(x => x.Ticket)
                    .WithMany()
                    .HasForeignKey(x => x.TicketId)
                    .OnDelete(DeleteBehavior.SetNull);

                e.HasOne(x => x.InterventionCatalog)
                    .WithMany()
                    .HasForeignKey(x => x.InterventionCatalogId)
                    .OnDelete(DeleteBehavior.SetNull);

                e.HasIndex(x => x.AssignedAgentId);
                e.HasIndex(x => x.ClientId);
                e.HasIndex(x => x.Statut);
            });

            // TicketHistory
            modelBuilder.Entity<TicketHistory>(e =>
            {
                e.HasOne(x => x.Ticket)
                    .WithMany()
                    .HasForeignKey(x => x.TicketId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => x.TicketId);
                e.HasIndex(x => x.CreatedAt);
            });

            // Notification
            modelBuilder.Entity<Notification>(e =>
            {
                e.HasIndex(x => new { x.RecipientUserId, x.IsRead, x.CreatedAt });
            });

            // UserCredential
            modelBuilder.Entity<UserCredential>(e =>
            {
                e.HasIndex(x => x.Email).IsUnique();
                e.HasIndex(x => x.UserId);
            });
        }
    }
}
