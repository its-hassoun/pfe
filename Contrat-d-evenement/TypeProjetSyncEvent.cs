namespace ITANIS.SharedEvents
{
    /// <summary>
    /// Événement unidirectionnel CRM → GestionProjet.
    /// Publié à chaque CRUD sur la table TypeProjet côté CRM (source de vérité).
    /// Nesrine maintient une copie locale via un consumer (lookup par TypeProjetGuid).
    /// </summary>
    public class TypeProjetSyncEvent
    {
        public Guid TypeProjetGuid { get; set; }
        public SyncAction Action { get; set; }

        public int Id { get; set; }
        public string Value { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public int Ordre { get; set; }

        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    }
}
