using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ModuleHelpDesk.Models
{
    public enum TicketActivityAction
    {
        Created = 0,
        StatusChanged = 1,
        AgentAssigned = 2,
        AgentTransferred = 3,
        PriorityChanged = 4,
        CommentAdded = 5,
        Closed = 6,
        Reopened = 7,
        InterventionLinked = 8
    }

    public class TicketHistory
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TicketId { get; set; }
        [ForeignKey("TicketId")]
        public virtual Ticket? Ticket { get; set; }

        [Required]
        public string ActorUserId { get; set; } = string.Empty;

        public TicketActivityAction Action { get; set; }

        [StringLength(200)]
        public string? FromValue { get; set; }
        [StringLength(200)]
        public string? ToValue { get; set; }
        [StringLength(1000)]
        public string? Note { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
