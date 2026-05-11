namespace ITANIS.SharedEvents
{
    /// <summary>
    /// Événement bidirectionnel : publié par ModuleRH ET par GestionProjet à chaque CRUD d'équipe.
    /// Chaque consumer filtre sur SourceModule pour ignorer ses propres événements (pas de boucle).
    /// Identification commune via EquipeGuid (UUID partagé entre les deux modules).
    /// Les Ids locaux (Id, ChefProjetIdOrigine, CollaborateurIdOrigine) restent des références source.
    /// </summary>
    public class EquipeSyncEvent
    {
        /// <summary>
        /// Identifiant stable partagé entre les deux modules. Généré par le créateur initial.
        /// Les deux côtés stockent cette valeur dans une colonne EquipeGuid + index unique.
        /// </summary>
        public Guid EquipeGuid { get; set; }

        /// <summary>
        /// Module source de l'événement ("RH" ou "GestionProjet").
        /// Les consumers ignorent les events dont SourceModule == leur propre module.
        /// </summary>
        public string SourceModule { get; set; } = string.Empty;

        public SyncAction Action { get; set; }

        /// <summary>
        /// ID local du module source (auto-increment côté source). Référence uniquement.
        /// </summary>
        public int Id { get; set; }

        public string Nom { get; set; } = string.Empty;
        public string Domaine { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? ChefProjetIdOrigine { get; set; }
        public bool IsActive { get; set; } = true;
        public List<EquipeMembreSyncDto> Membres { get; set; } = new();
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    }

    public class EquipeMembreSyncDto
    {
        public int CollaborateurIdOrigine { get; set; }
        /// <summary>
        /// "interne" ou "externe". Optionnel : si vide, la RH déduit le type en
        /// cherchant l'Id dans CollaborateursInternes puis CollaborateursExternes.
        /// Renseigné par la RH quand elle publie ; Nesrine n'a pas besoin de le remplir.
        /// </summary>
        public string CollaborateurType { get; set; } = string.Empty;
        public string RoleDansEquipe { get; set; } = "Agent";
        public DateTime DateAffectation { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Noms des modules pour le champ SourceModule de EquipeSyncEvent.
    /// </summary>
    public static class SyncSourceModule
    {
        public const string RH = "RH";
        public const string GestionProjet = "GestionProjet";
    }
}
