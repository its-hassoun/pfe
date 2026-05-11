using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ModuleHelpDesk.Authorization;
using ModuleHelpDesk.Data;
using ModuleHelpDesk.Models;

namespace ModuleHelpDesk.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/helpdesk/[controller]")]
    public class AgentsController : ControllerBase
    {
        private readonly HelpDeskDbContext _db;
        public AgentsController(HelpDeskDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] string? search)
        {
            var q = _db.Agents.AsNoTracking().Where(a => a.IsActive);
            if (!string.IsNullOrEmpty(search))
            {
                var s = search.ToLower();
                q = q.Where(a =>
                    a.Nom.ToLower().Contains(s) ||
                    a.Prenom.ToLower().Contains(s) ||
                    a.Email.ToLower().Contains(s) ||
                    a.Departement.ToLower().Contains(s));
            }
            return Ok(await q.OrderBy(a => a.Nom).ToListAsync());
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> Get(int id)
        {
            var a = await _db.Agents.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            return a == null ? NotFound() : Ok(a);
        }

        [HttpGet("{id:int}/stats")]
        public async Task<IActionResult> Stats(int id)
        {
            var idStr = id.ToString();
            var assigned = await _db.Tickets.CountAsync(t => t.AgentPrincipalId == idStr && t.Statut != StatutTicket.Clos);
            var resolved = await _db.Tickets.CountAsync(t => t.AgentPrincipalId == idStr && t.Statut == StatutTicket.Clos);
            var interventions = await _db.InterventionExecutions.CountAsync(i => i.AssignedAgentId == idStr);
            return Ok(new { assigned, resolved, interventions });
        }
    }
}
