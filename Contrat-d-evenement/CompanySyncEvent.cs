namespace ITANIS.SharedEvents
{
    /// <summary>
    /// Publié par ModuleCRM à chaque création / modification / suppression d'une Company.
    /// Consommé par GestionProjet pour maintenir un read-replica local des clients.
    /// </summary>
    public class CompanySyncEvent
    {
        public SyncAction Action { get; set; }
        public int Id { get; set; }
        public string RaisonSociale { get; set; } = string.Empty;
        public string? Secteur { get; set; }
        public string? EmailPrincipal { get; set; }
        public string? TelephonePrincipal { get; set; }
        public string? Adresse { get; set; }
        public string? CodePostal { get; set; }
        public string? Ville { get; set; }
        public string? Pays { get; set; }
        public string? MatriculeFiscal { get; set; }
        public string? Statut { get; set; }
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    }
}
