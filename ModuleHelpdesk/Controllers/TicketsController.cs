using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ModuleHelpDesk.Authorization;
using ModuleHelpDesk.Data;
using ModuleHelpDesk.Models;
using ModuleHelpDesk.Repositories;
using ModuleHelpDesk.Services;
using MassTransit;

namespace ModuleHelpDesk.Controllers
{
    public record AssignTicketDto(string AgentId);
    public record ChangePriorityDto(PrioriteTicket Priority);
    public record CommentDto(string Content);

    [ApiController]
    [Authorize]
    [Route("api/helpdesk/[controller]")]
    public class TicketsController : ControllerBase
    {
        private readonly ITicketRepository _repo;
        private readonly IPublishEndpoint _publishEndpoint;
        private readonly INotificationService _notify;
        private readonly ICurrentUser _me;
        private readonly HelpDeskDbContext _db;

        public TicketsController(
            ITicketRepository repo,
            IPublishEndpoint publishEndpoint,
            INotificationService notify,
            ICurrentUser me,
            HelpDeskDbContext db)
        {
            _repo = repo;
            _publishEndpoint = publishEndpoint;
            _notify = notify;
            _me = me;
            _db = db;
        }

        // ── Listing & scoping ───────────────────────────────────────────────

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var all = await _repo.GetAllAsync();
            return Ok(Scope(all));
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var t = await _repo.GetByIdAsync(id);
            if (t == null) return NotFound();
            if (!CanAccess(t)) return Forbid();
            return Ok(t);
        }

        [HttpGet("client/{clientId}")]
        public async Task<IActionResult> GetByClient(string clientId)
        {
            if (!_me.IsInRole(Roles.Admin, Roles.Agent) && _me.Id != clientId) return Forbid();
            return Ok(await _repo.GetByClientAsync(clientId));
        }

        [HttpGet("agent/{agentId}")]
        public async Task<IActionResult> GetByAgent(string agentId)
        {
            if (!_me.IsInRole(Roles.Admin) && _me.Id != agentId) return Forbid();
            return Ok(await _repo.GetByAgentAsync(agentId));
        }

        [HttpGet("filter/status/{status}")]
        public async Task<IActionResult> GetByStatus(StatutTicket status) =>
            Ok(Scope(await _repo.GetByStatusAsync(status)));

        [HttpGet("filter/priority/{priority}")]
        public async Task<IActionResult> GetByPriority(PrioriteTicket priority) =>
            Ok(Scope(await _repo.GetByPriorityAsync(priority)));

        // ── Mutations ───────────────────────────────────────────────────────

        [HttpPost]
        public async Task<IActionResult> Create(Ticket ticket)
        {
            if (ticket == null) return BadRequest();
            // Clients can only file tickets for themselves
            if (_me.IsInRole(Roles.Client, Roles.SubClient))
            {
                ticket.ClientId = _me.Id!;
                if (_me.IsInRole(Roles.SubClient)) ticket.SousClientId = _me.Id;
            }

            var created = await _repo.CreateAsync(ticket);
            await WriteHistory(created.Id, TicketActivityAction.Created, null, null, null);

            // Notify admins / assigned agent (if any)
            if (!string.IsNullOrEmpty(created.AgentPrincipalId))
            {
                await _notify.NotifyAsync(new NotifyPayload(
                    RecipientUserId: created.AgentPrincipalId,
                    Type: NotificationType.TicketAssigned,
                    Title: "Nouveau ticket assigné",
                    Message: $"Ticket #{created.Id} — {created.Titre}",
                    TicketId: created.Id,
                    ActorUserId: _me.Id));
            }
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = Roles.Staff)]
        public async Task<IActionResult> Update(int id, Ticket ticket)
        {
            if (id != ticket.Id) return BadRequest();
            await _repo.UpdateAsync(ticket);
            return NoContent();
        }

        [HttpPatch("{id:int}/status")]
        public async Task<IActionResult> ChangeStatus(int id, [FromBody] int newStatus)
        {
            var ticket = await _repo.GetByIdAsync(id);
            if (ticket == null) return NotFound();
            if (!CanMutateStatus(ticket)) return Forbid();

            var previous = ticket.Statut;
            await _repo.ChangeStatusAsync(id, newStatus);
            var current = (StatutTicket)newStatus;

            await WriteHistory(id,
                current == StatutTicket.Clos ? TicketActivityAction.Closed : TicketActivityAction.StatusChanged,
                previous.ToString(), current.ToString(), null);

            // Notify on status change
            if (!string.IsNullOrEmpty(ticket.AgentPrincipalId) && ticket.AgentPrincipalId != _me.Id)
                await _notify.NotifyAsync(new NotifyPayload(
                    RecipientUserId: ticket.AgentPrincipalId,
                    Type: NotificationType.TicketStatusChanged,
                    Title: "Statut du ticket modifié",
                    Message: $"Ticket #{id} : {previous} → {current}",
                    TicketId: id,
                    ActorUserId: _me.Id));

            if (current == StatutTicket.Clos && !string.IsNullOrEmpty(ticket.ClientId))
                await _notify.NotifyAsync(new NotifyPayload(
                    RecipientUserId: ticket.ClientId,
                    Type: NotificationType.TicketCompleted,
                    Title: "Ticket clôturé",
                    Message: $"Votre ticket #{id} a été clôturé.",
                    TicketId: id,
                    ActorUserId: _me.Id));

            return NoContent();
        }

        [HttpPut("{id:int}/transfer")]
        [Authorize(Roles = Roles.Staff)]
        public async Task<IActionResult> TransferTicket(int id, [FromBody] string newAgentId)
        {
            var ticket = await _repo.GetByIdAsync(id);
            if (ticket == null) return NotFound();

            var previous = ticket.AgentPrincipalId;
            await _repo.TransferTicketAsync(id, newAgentId);
            await WriteHistory(id, TicketActivityAction.AgentTransferred, previous, newAgentId, null);

            await _publishEndpoint.Publish(new
            {
                TicketId = id,
                NewAgentId = newAgentId,
                TransferredAt = DateTime.UtcNow
            });

            if (!string.IsNullOrEmpty(newAgentId))
                await _notify.NotifyAsync(new NotifyPayload(
                    RecipientUserId: newAgentId,
                    Type: NotificationType.TicketTransferred,
                    Title: "Ticket transféré",
                    Message: $"Le ticket #{id} \"{ticket.Titre}\" vous a été transféré.",
                    TicketId: id,
                    ActorUserId: _me.Id));

            return Ok(new { message = $"Ticket transféré à l'agent {newAgentId}" });
        }

        [HttpPatch("{id:int}/assign")]
        [Authorize(Roles = Roles.Staff)]
        public async Task<IActionResult> Assign(int id, [FromBody] AssignTicketDto dto)
        {
            var ticket = await _repo.GetByIdAsync(id);
            if (ticket == null) return NotFound();
            if (string.IsNullOrEmpty(dto?.AgentId)) return BadRequest(new { error = "AgentId required" });

            var previous = ticket.AgentPrincipalId;
            ticket.AgentPrincipalId = dto.AgentId;
            await _repo.UpdateAsync(ticket);
            await WriteHistory(id, TicketActivityAction.AgentAssigned, previous, dto.AgentId, null);

            await _notify.NotifyAsync(new NotifyPayload(
                RecipientUserId: dto.AgentId,
                Type: NotificationType.TicketAssigned,
                Title: "Ticket assigné",
                Message: $"Le ticket #{id} \"{ticket.Titre}\" vous a été assigné.",
                TicketId: id,
                ActorUserId: _me.Id));
            return NoContent();
        }

        [HttpPatch("{id:int}/priority")]
        [Authorize(Roles = Roles.Staff)]
        public async Task<IActionResult> ChangePriority(int id, [FromBody] ChangePriorityDto dto)
        {
            var ticket = await _repo.GetByIdAsync(id);
            if (ticket == null) return NotFound();
            var previous = ticket.Priorite;
            ticket.Priorite = dto.Priority;
            await _repo.UpdateAsync(ticket);
            await WriteHistory(id, TicketActivityAction.PriorityChanged, previous.ToString(), dto.Priority.ToString(), null);

            if (!string.IsNullOrEmpty(ticket.AgentPrincipalId) && ticket.AgentPrincipalId != _me.Id)
                await _notify.NotifyAsync(new NotifyPayload(
                    RecipientUserId: ticket.AgentPrincipalId,
                    Type: NotificationType.PriorityChanged,
                    Title: "Priorité modifiée",
                    Message: $"Ticket #{id} : priorité {previous} → {dto.Priority}",
                    TicketId: id,
                    ActorUserId: _me.Id));
            return NoContent();
        }

        [HttpGet("{id:int}/comments")]
        public async Task<IActionResult> GetComments(int id)
        {
            var ticket = await _repo.GetByIdAsync(id);
            if (ticket == null) return NotFound();
            if (!CanAccess(ticket)) return Forbid();

            var rows = await _db.MessageTickets.AsNoTracking()
                .Where(m => m.TicketId == id)
                .OrderBy(m => m.DateEnvoi)
                .ToListAsync();
            return Ok(rows);
        }

        [HttpPost("{id:int}/comments")]
        public async Task<IActionResult> AddComment(int id, [FromBody] CommentDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto?.Content)) return BadRequest();
            var ticket = await _repo.GetByIdAsync(id);
            if (ticket == null) return NotFound();
            if (!CanAccess(ticket)) return Forbid();

            var msg = new MessageTicket
            {
                TicketId = id,
                EnvoyeParId = _me.Id ?? "system",
                Contenu = dto.Content.Trim(),
                DateEnvoi = DateTime.UtcNow,
                EstLu = false
            };
            _db.MessageTickets.Add(msg);
            await _db.SaveChangesAsync();

            await WriteHistory(id, TicketActivityAction.CommentAdded, null, null, dto.Content[..Math.Min(200, dto.Content.Length)]);

            // Notify participants (client + agent + collaborators), excluding the actor
            var recipients = new HashSet<string?>(new[] { ticket.ClientId, ticket.SousClientId, ticket.AgentPrincipalId });
            var collabs = await _db.TicketCollaborateurs.Where(c => c.TicketId == id).Select(c => c.AgentId).ToListAsync();
            foreach (var c in collabs) recipients.Add(c);
            recipients.Remove(_me.Id);
            foreach (var r in recipients)
            {
                if (!string.IsNullOrEmpty(r))
                    await _notify.NotifyAsync(new NotifyPayload(
                        RecipientUserId: r!,
                        Type: NotificationType.TicketCommentAdded,
                        Title: "Nouveau commentaire",
                        Message: $"Nouveau commentaire sur le ticket #{id}.",
                        TicketId: id,
                        ActorUserId: _me.Id));
            }

            return Ok(msg);
        }

        [HttpGet("{id:int}/history")]
        public async Task<IActionResult> GetHistory(int id)
        {
            var ticket = await _repo.GetByIdAsync(id);
            if (ticket == null) return NotFound();
            if (!CanAccess(ticket)) return Forbid();
            var rows = await _db.TicketHistories.AsNoTracking()
                .Where(h => h.TicketId == id)
                .OrderByDescending(h => h.CreatedAt)
                .ToListAsync();
            return Ok(rows);
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> Delete(int id)
        {
            await _repo.DeleteAsync(id);
            return NoContent();
        }

        // ── Collaborators ───────────────────────────────────────────────────

        [HttpGet("{id:int}/collaborateurs")]
        public async Task<IActionResult> GetCollaborateurs(int id) =>
            Ok(await _repo.GetCollaborateursByTicketIdAsync(id));

        [HttpPost("{id:int}/collaborateurs/bulk")]
        [Authorize(Roles = Roles.Staff)]
        public async Task<IActionResult> AddCollaborateurs(int id, [FromBody] List<string> agentIds)
        {
            await _repo.AddCollaborateursAsync(id, agentIds);
            foreach (var a in agentIds)
                if (!string.IsNullOrEmpty(a) && a != _me.Id)
                    await _notify.NotifyAsync(new NotifyPayload(
                        RecipientUserId: a,
                        Type: NotificationType.TicketAssigned,
                        Title: "Ajouté comme collaborateur",
                        Message: $"Vous êtes collaborateur sur le ticket #{id}.",
                        TicketId: id,
                        ActorUserId: _me.Id));
            return Ok(new { message = "Collaborateurs ajoutés." });
        }

        [HttpPut("{id:int}/collaborateurs/sync")]
        [Authorize(Roles = Roles.Staff)]
        public async Task<IActionResult> SyncCollaborateurs(int id, [FromBody] List<string> agentIds)
        {
            await _repo.SyncCollaborateursAsync(id, agentIds);
            return Ok(new { message = "Liste des collaborateurs synchronisée." });
        }

        [HttpGet("facturation")]
        [Authorize(Roles = Roles.Staff)]
        public async Task<IActionResult> GetFacture([FromQuery] string clientId, [FromQuery] DateTime start, [FromQuery] DateTime end)
        {
            var tickets = await _repo.GetTicketsForFacturationAsync(clientId, start, end);
            return Ok(new
            {
                TotalTickets = tickets.Count(),
                Tickets = tickets,
                Periode = $"Du {start:dd/MM/yyyy} au {end:dd/MM/yyyy}"
            });
        }

        // ── Helpers ─────────────────────────────────────────────────────────

        private IEnumerable<Ticket> Scope(IEnumerable<Ticket> all)
        {
            if (_me.IsInRole(Roles.Admin)) return all;
            if (_me.IsInRole(Roles.Agent))
                return all.Where(t => t.AgentPrincipalId == _me.Id
                                      || t.Collaborateurs.Any(c => c.AgentId == _me.Id));
            if (_me.IsInRole(Roles.Client)) return all.Where(t => t.ClientId == _me.Id);
            if (_me.IsInRole(Roles.SubClient)) return all.Where(t => t.SousClientId == _me.Id);
            return Enumerable.Empty<Ticket>();
        }

        private bool CanAccess(Ticket t)
        {
            if (_me.IsInRole(Roles.Admin)) return true;
            if (_me.IsInRole(Roles.Agent))
                return t.AgentPrincipalId == _me.Id || t.Collaborateurs.Any(c => c.AgentId == _me.Id);
            if (_me.IsInRole(Roles.Client)) return t.ClientId == _me.Id;
            if (_me.IsInRole(Roles.SubClient)) return t.SousClientId == _me.Id;
            return false;
        }

        private bool CanMutateStatus(Ticket t) =>
            _me.IsInRole(Roles.Admin) ||
            (_me.IsInRole(Roles.Agent) && (t.AgentPrincipalId == _me.Id || t.Collaborateurs.Any(c => c.AgentId == _me.Id)));

        private async Task WriteHistory(int ticketId, TicketActivityAction action, string? from, string? to, string? note)
        {
            _db.TicketHistories.Add(new TicketHistory
            {
                TicketId = ticketId,
                ActorUserId = _me.Id ?? "system",
                Action = action,
                FromValue = from,
                ToValue = to,
                Note = note,
                CreatedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();
        }
    }
}
