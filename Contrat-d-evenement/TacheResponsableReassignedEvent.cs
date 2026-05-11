namespace ITANIS.SharedEvents
{
    public class TacheResponsableReassignedEvent
    {
        public int AncienResponsableId { get; set; }
        public string AncienResponsableType { get; set; } = string.Empty; // "interne" | "externe"
        public int NouveauResponsableId { get; set; }
        public string NouveauResponsableType { get; set; } = string.Empty;
        public string NouveauResponsableNom { get; set; } = string.Empty;
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    }
}
