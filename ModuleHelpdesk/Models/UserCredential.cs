using System;
using System.ComponentModel.DataAnnotations;

namespace ModuleHelpDesk.Models
{
    public enum UserKind
    {
        Agent = 0,
        Contact = 1
    }

    public class UserCredential
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string Role { get; set; } = "Agent";

        public UserKind Kind { get; set; } = UserKind.Agent;
        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
