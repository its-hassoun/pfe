using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ModuleHelpDesk.Data;
using ModuleHelpDesk.Models;

namespace ModuleHelpDesk.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/helpdesk/[controller]")]
    public class ClientsController : ControllerBase
    {
        private readonly HelpDeskDbContext _db;
        public ClientsController(HelpDeskDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] string? search)
        {
            var q = _db.Companies.AsNoTracking().AsQueryable();
            if (!string.IsNullOrEmpty(search))
            {
                var s = search.ToLower();
                q = q.Where(c =>
                    c.RaisonSociale.ToLower().Contains(s) ||
                    (c.EmailPrincipal ?? "").ToLower().Contains(s) ||
                    (c.Ville ?? "").ToLower().Contains(s));
            }
            var companies = await q.OrderBy(c => c.RaisonSociale).ToListAsync();
            return Ok(companies);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> Get(int id)
        {
            var c = await _db.Companies.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            if (c == null) return NotFound();
            var contacts = await _db.Contacts.AsNoTracking()
                .Where(x => x.CompanyId == id)
                .ToListAsync();
            return Ok(new { company = c, contacts });
        }

        [HttpGet("{id:int}/tickets")]
        public async Task<IActionResult> Tickets(int id)
        {
            var idStr = id.ToString();
            var list = await _db.Tickets.AsNoTracking()
                .Where(t => t.ClientId == idStr)
                .OrderByDescending(t => t.DateCreation)
                .ToListAsync();
            return Ok(list);
        }

        [HttpGet("{id:int}/contacts")]
        public async Task<IActionResult> Contacts(int id)
        {
            var list = await _db.Contacts.AsNoTracking().Where(x => x.CompanyId == id).ToListAsync();
            return Ok(list);
        }
    }
}
