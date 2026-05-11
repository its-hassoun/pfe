namespace ITANIS.SharedEvents
{
    public class ProjetSyncEvent
    {
        public SyncAction Action { get; set; }
        public int Id { get; set; }
        public int OpportuniteIdOrigine { get; set; }
        public string Nom { get; set; } = string.Empty;
        public string Statut { get; set; } = string.Empty;
        public DateTime DateDebut { get; set; }
        public DateTime DateFinPrevue { get; set; }
        public string ClientRaisonSociale { get; set; } = string.Empty;
        public decimal BudgetEstime { get; set; }
        public decimal? BudgetReel { get; set; }
        public string Description { get; set; } = string.Empty;
        public string TypeProjet { get; set; } = string.Empty;
        public int ClientId { get; set; }

        public List<PhaseSyncDto> Phases { get; set; } = new();
    }

    public class PhaseSyncDto
    {
        public string TypePhase { get; set; } = string.Empty;
        public List<TacheSyncDto> Taches { get; set; } = new();
    }

    public class TacheSyncDto
    {
        public string Titre { get; set; } = string.Empty;
        public string Statut { get; set; } = string.Empty;
        public List<SousTacheSyncDto> SousTaches { get; set; } = new();
        public string? ResponsableNom { get; set; }
        public int? ResponsableId { get; set; }
    }

    public class SousTacheSyncDto
    {
        public string Titre { get; set; } = string.Empty;
        public string Statut { get; set; } = string.Empty;
        public decimal DureeEstimeeHeures { get; set; }
        public string? ResponsableNom { get; set; }
        public int? ResponsableId { get; set; }
    }
}
