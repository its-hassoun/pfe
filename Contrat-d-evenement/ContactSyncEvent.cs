namespace ITANIS.SharedEvents
{
    /// <summary>
    /// Publié par ModuleCRM à chaque création / modification / suppression d'un Contact.
    /// Consommé par le module Helpdesk pour maintenir un read-replica local des contacts clients.
    /// </summary>
    public class ContactSyncEvent
    {
        public SyncAction Action { get; set; }
        public int Id { get; set; }
        public int CompanyId { get; set; }
        public string Nom { get; set; } = string.Empty;
        public string Prenom { get; set; } = string.Empty;
        public string? Poste { get; set; }
        public string Email { get; set; } = string.Empty;
        public string? Telephone { get; set; }
        public string? TelephoneCountry { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    }
}
