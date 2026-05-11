using System;
using System.ComponentModel.DataAnnotations;

namespace ModuleHelpDesk.Models
{
    public enum NotificationType
    {
        TicketTransferred = 0,
        TicketAssigned = 1,
        TicketStatusChanged = 2,
        TicketCompleted = 3,
        TicketCommentAdded = 4,
        InterventionCreated = 5,
        InterventionAssigned = 6,
        InterventionScheduled = 7,
        InterventionCompleted = 8,
        InterventionCancelled = 9,
        PriorityChanged = 10,
        ClientReplyRequired = 11,
        SlaWarning = 12
    }

    public class Notification
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string RecipientUserId { get; set; } = string.Empty;

        public string? ActorUserId { get; set; }

        public NotificationType Type { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [StringLength(1000)]
        public string Message { get; set; } = string.Empty;

        public int? TicketId { get; set; }
        public int? InterventionId { get; set; }

        public string? Metadata { get; set; }

        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
