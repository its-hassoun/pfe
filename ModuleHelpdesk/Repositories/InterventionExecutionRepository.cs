using Microsoft.EntityFrameworkCore;
using ModuleHelpDesk.Data;
using ModuleHelpDesk.Models;

namespace ModuleHelpDesk.Repositories
{
    public class InterventionExecutionRepository : IInterventionExecutionRepository
    {
        private readonly HelpDeskDbContext _db;
        public InterventionExecutionRepository(HelpDeskDbContext db) => _db = db;

        public async Task<IEnumerable<InterventionExecution>> ListAsync(string? agentId, string? clientId, InterventionStatut? status, string? search)
        {
            var q = _db.InterventionExecutions
                .Include(i => i.Ticket)
                .Include(i => i.InterventionCatalog)
                .AsQueryable();

            if (!string.IsNullOrEmpty(agentId)) q = q.Where(i => i.AssignedAgentId == agentId);
            if (!string.IsNullOrEmpty(clientId)) q = q.Where(i => i.ClientId == clientId);
            if (status.HasValue) q = q.Where(i => i.Statut == status);
            if (!string.IsNullOrEmpty(search))
            {
                var s = search.ToLower();
                q = q.Where(i =>
                    i.Titre.ToLower().Contains(s) ||
                    (i.Description ?? "").ToLower().Contains(s) ||
                    i.ClientId.ToLower().Contains(s));
            }
            return await q.OrderByDescending(i => i.CreatedAt).ToListAsync();
        }

        public Task<InterventionExecution?> GetByIdAsync(int id) =>
            _db.InterventionExecutions
                .Include(i => i.Ticket)
                .Include(i => i.InterventionCatalog)
                .FirstOrDefaultAsync(i => i.Id == id);

        public async Task<InterventionExecution> CreateAsync(InterventionExecution e)
        {
            e.CreatedAt = DateTime.UtcNow;
            e.UpdatedAt = DateTime.UtcNow;
            _db.InterventionExecutions.Add(e);
            await _db.SaveChangesAsync();
            return e;
        }

        public async Task UpdateAsync(InterventionExecution e)
        {
            e.UpdatedAt = DateTime.UtcNow;
            _db.InterventionExecutions.Update(e);
            await _db.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var e = await _db.InterventionExecutions.FindAsync(id);
            if (e == null) return;
            _db.InterventionExecutions.Remove(e);
            await _db.SaveChangesAsync();
        }

        public async Task<bool> AssignAsync(int id, string agentId)
        {
            var e = await _db.InterventionExecutions.FindAsync(id);
            if (e == null) return false;
            e.AssignedAgentId = agentId;
            e.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ChangeStatusAsync(int id, InterventionStatut status)
        {
            var e = await _db.InterventionExecutions.FindAsync(id);
            if (e == null) return false;
            e.Statut = status;
            switch (status)
            {
                case InterventionStatut.InProgress:
                    e.StartedAt ??= DateTime.UtcNow;
                    break;
                case InterventionStatut.Completed:
                    e.CompletedAt ??= DateTime.UtcNow;
                    break;
            }
            e.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CompleteWithReportAsync(int id, string report)
        {
            var e = await _db.InterventionExecutions.FindAsync(id);
            if (e == null) return false;
            e.RapportResolution = report;
            e.Statut = InterventionStatut.Completed;
            e.CompletedAt ??= DateTime.UtcNow;
            e.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
