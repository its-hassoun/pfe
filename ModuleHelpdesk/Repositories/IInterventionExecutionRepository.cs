using ModuleHelpDesk.Models;

namespace ModuleHelpDesk.Repositories
{
    public interface IInterventionExecutionRepository
    {
        Task<IEnumerable<InterventionExecution>> ListAsync(string? agentId, string? clientId, InterventionStatut? status, string? search);
        Task<InterventionExecution?> GetByIdAsync(int id);
        Task<InterventionExecution> CreateAsync(InterventionExecution entity);
        Task UpdateAsync(InterventionExecution entity);
        Task DeleteAsync(int id);
        Task<bool> AssignAsync(int id, string agentId);
        Task<bool> ChangeStatusAsync(int id, InterventionStatut status);
        Task<bool> CompleteWithReportAsync(int id, string report);
    }
}
