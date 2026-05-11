using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ModuleHelpDesk.Models
{
    public enum InterventionStatut
    {
        Pending = 0,
        Scheduled = 1,
        InProgress = 2,
        Completed = 3,
        Cancelled = 4
    }

    public class InterventionExecution
    {
        [Key]
        public int Id { get; set; }

        public int? TicketId { get; set; }
        [ForeignKey("TicketId")]
        public virtual Ticket? Ticket { get; set; }

        public int? InterventionCatalogId { get; set; }
        [ForeignKey("InterventionCatalogId")]
        public virtual Intervention? InterventionCatalog { get; set; }

        [Required]
        public string ClientId { get; set; } = string.Empty;
        public string? SousClientId { get; set; }

        public string? AssignedAgentId { get; set; }

        [Required]
        [StringLength(200)]
        public string Titre { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        public CategorieAction Categorie { get; set; }

        public PrioriteTicket Priorite { get; set; } = PrioriteTicket.Moyenne;

        public InterventionStatut Statut { get; set; } = InterventionStatut.Pending;

        public DateTime? ScheduledAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }

        [StringLength(500)]
        public string? Location { get; set; }
        public bool IsRemote { get; set; }

        public string? RapportResolution { get; set; }

        [Required]
        public string CreatedById { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
