namespace ITANIS.SharedEvents
{
    /// <summary>
    /// Contrat partagé entre ModuleCRM (publisher) et GestionProjet (consumer).
    /// Quand une opportunité "gagnée" est convertie en projet, cet événement est publié sur RabbitMQ.
    /// </summary>
    public class OpportuniteConvertieEvent
    {
        public int OpportunityId { get; set; }
        public string Titre { get; set; } = string.Empty;
        public string? Description { get; set; }
        // IDs CRM envoyés comme référence d'origine (à stocker dans des colonnes *IdOrigine*, pas comme PK).
        public int CompanyIdOrigine { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public decimal ValeurEstimee { get; set; }
        public int? AgentCommercialIdOrigine { get; set; }
        public int? AgentCdcIdOrigine { get; set; }
        public DateTime? DateCloturePrevu { get; set; }
        public string? Type { get; set; }
        public string? SubType { get; set; }
        public string? TypeProjet { get; set; }

        // Cahier de charge
        public string? CdcFilePath { get; set; }
        public string? CdcFileName { get; set; }
        public string? CdcContentType { get; set; }
        public byte[]? CdcFileContent { get; set; }

        // Champs saisis dans le formulaire de conversion (prioritaires sur les champs de l'opportunité si présents)
        public string? NomProjet { get; set; }
        public string? DescriptionProjet { get; set; }
        public DateTime? DateDebutProjet { get; set; }
        public decimal? BudgetConfirme { get; set; }

        /// <summary>
        /// ID d'origine de l'équipe assignée (table Equipes côté RH). Nesrine résout via EquipeIdOrigine
        /// ou EquipeGuid (recommandé, car l'équipe peut aussi exister côté Nesrine avec un autre PK local).
        /// Le chef de projet est déduit de l'équipe (equipe.ChefProjet).
        /// </summary>
        public int? EquipeIdOrigine { get; set; }

        /// <summary>
        /// GUID stable partagé de l'équipe (EquipeSyncEvent). Préférer ce champ à EquipeIdOrigine pour
        /// la résolution côté Nesrine, car il matche indépendamment des PKs auto-increment.
        /// </summary>
        public Guid? EquipeGuid { get; set; }

        public string ConvertedBy { get; set; } = string.Empty;
        public DateTime ConvertedAt { get; set; } = DateTime.UtcNow;
    }
}
