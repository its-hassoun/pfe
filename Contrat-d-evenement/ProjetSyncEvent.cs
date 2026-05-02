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
    }
}
