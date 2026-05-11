namespace ITANIS.SharedEvents
{
    /// <summary>
    /// Publié par ModuleRH à chaque création / modification / suppression d'un Agent.
    /// Consommé par GestionProjet pour maintenir un read-replica local des agents.
    /// </summary>
    public class AgentSyncEvent
    {
        public SyncAction Action { get; set; }
        public int Id { get; set; }
        public string Nom { get; set; } = string.Empty;
        public string Prenom { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Telephone { get; set; }
        public string Role { get; set; } = string.Empty;
        public string Poste { get; set; } = string.Empty;
        public string Departement { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public string? AgentType { get; set; }
        public decimal? CoutHoraire { get; set; }
        public decimal? Rating { get; set; }
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    }
}
