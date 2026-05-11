using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ModuleHelpDesk.Authorization;
using ModuleHelpDesk.Data;
using ModuleHelpDesk.Models;
using ModuleHelpDesk.Services;

namespace ModuleHelpDesk.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/helpdesk/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly HelpDeskDbContext _db;
        private readonly ICurrentUser _me;

        public DashboardController(HelpDeskDbContext db, ICurrentUser me)
        {
            _db = db;
            _me = me;
        }

        private IQueryable<Ticket> ScopedTickets()
        {
            var q = _db.Tickets.AsNoTracking();
            if (_me.IsInRole(Roles.Agent)) q = q.Where(t => t.AgentPrincipalId == _me.Id);
            else if (_me.IsInRole(Roles.Client)) q = q.Where(t => t.ClientId == _me.Id);
            else if (_me.IsInRole(Roles.SubClient)) q = q.Where(t => t.SousClientId == _me.Id);
            return q;
        }

        private IQueryable<InterventionExecution> ScopedInterventions()
        {
            var q = _db.InterventionExecutions.AsNoTracking();
            if (_me.IsInRole(Roles.Agent)) q = q.Where(i => i.AssignedAgentId == _me.Id);
            else if (_me.IsInRole(Roles.Client)) q = q.Where(i => i.ClientId == _me.Id);
            else if (_me.IsInRole(Roles.SubClient)) q = q.Where(i => i.SousClientId == _me.Id);
            return q;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> Stats()
        {
            var t = ScopedTickets();
            var total = await t.CountAsync();
            var nouveau = await t.CountAsync(x => x.Statut == StatutTicket.Nouveau);
            var enAttente = await t.CountAsync(x => x.Statut == StatutTicket.EnAttente);
            var ouvert = await t.CountAsync(x => x.Statut == StatutTicket.Ouvert);
            var enPause = await t.CountAsync(x => x.Statut == StatutTicket.EnPause);
            var clos = await t.CountAsync(x => x.Statut == StatutTicket.Clos);
            var rejete = await t.CountAsync(x => x.Statut == StatutTicket.Rejete);

            var i = ScopedInterventions();
            var iTotal = await i.CountAsync();
            var iPending = await i.CountAsync(x => x.Statut == InterventionStatut.Pending);
            var iScheduled = await i.CountAsync(x => x.Statut == InterventionStatut.Scheduled);
            var iInProgress = await i.CountAsync(x => x.Statut == InterventionStatut.InProgress);
            var iCompleted = await i.CountAsync(x => x.Statut == InterventionStatut.Completed);

            return Ok(new
            {
                tickets = new
                {
                    total,
                    nouveau,
                    enAttente,
                    ouvert,
                    enPause,
                    clos,
                    rejete
                },
                interventions = new
                {
                    total = iTotal,
                    pending = iPending,
                    scheduled = iScheduled,
                    inProgress = iInProgress,
                    completed = iCompleted
                }
            });
        }

        [HttpGet("recent-tickets")]
        public async Task<IActionResult> RecentTickets([FromQuery] int take = 5)
        {
            var list = await ScopedTickets()
                .OrderByDescending(t => t.DateCreation)
                .Take(Math.Min(take, 50))
                .ToListAsync();
            return Ok(list);
        }

        [HttpGet("recent-interventions")]
        public async Task<IActionResult> RecentInterventions([FromQuery] int take = 5)
        {
            var list = await ScopedInterventions()
                .OrderByDescending(i => i.CreatedAt)
                .Take(Math.Min(take, 50))
                .ToListAsync();
            return Ok(list);
        }

        [HttpGet("activity")]
        public async Task<IActionResult> Activity([FromQuery] int take = 20)
        {
            // Aggregate from TicketHistories for tickets the user can see.
            var visibleTicketIds = await ScopedTickets().Select(t => t.Id).ToListAsync();
            var rows = await _db.TicketHistories.AsNoTracking()
                .Where(h => visibleTicketIds.Contains(h.TicketId))
                .OrderByDescending(h => h.CreatedAt)
                .Take(Math.Min(take, 100))
                .ToListAsync();
            return Ok(rows);
        }
    }
}
