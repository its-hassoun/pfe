namespace ITANIS.SharedEvents
{
    /// <summary>
    /// Publié par ModuleHelpdesk lorsqu'Oussema modifie la note d'un agent.
    /// Consommé par ModuleRH pour mettre à jour Agent.Rating sans republier d'AgentSyncEvent
    /// (évite la boucle helpdesk → RH → helpdesk).
    /// </summary>
    public class AgentRatingUpdatedEvent
    {
        public int AgentId { get; set; }
        public decimal? Rating { get; set; }
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    }
}
