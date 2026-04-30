using System.ComponentModel.DataAnnotations;

namespace ModuleHelpDeskTimesheet.Models
{
    public class Calendrier
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string AgentId { get; set; } = string.Empty;

        [Required]
        public string Titre { get; set; } = string.Empty; 

        public string? Description { get; set; }

        [Required]
        public DateTime DateDebut { get; set; }

        [Required]
        public DateTime DateFin { get; set; }

      
    }
}