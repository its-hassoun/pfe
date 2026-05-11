using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ModuleHelpDesk.Authorization;
using ModuleHelpDesk.Data;
using ModuleHelpDesk.Models;
using ModuleHelpDesk.Repositories;
using ModuleHelpDesk.Services;

namespace ModuleHelpDesk.Controllers
{
    public record CreateInterventionDto(
        int? TicketId,
        int? InterventionCatalogId,
        string ClientId,
        string? SousClientId,
        string? AssignedAgentId,
        string Titre,
        string? Description,
        CategorieAction Categorie,
        PrioriteTicket Priorite,
        DateTime? ScheduledAt,
        string? Location,
        bool IsRemote
    );

    public record UpdateInterventionDto(
        string Titre,
        string? Description,
        CategorieAction Categorie,
        PrioriteTicket Priorite,
        DateTime? ScheduledAt,
        string? Location,
        bool IsRemote,
        int? TicketId,
        int? InterventionCatalogId
    );

    public record AssignAgentDto(string AgentId);
    public record ChangeStatusDto(InterventionStatut Status);
    public record ReportDto(string Report);

    [ApiController]
    [Authorize]
    [Route("api/helpdesk/intervention-executions")]
    public class InterventionExecutionsController : ControllerBase
    {
        private readonly IInterventionExecutionRepository _repo;
        private readonly INotificationService _notify;
        private readonly ICurrentUser _me;
        private readonly HelpDeskDbContext _db;

        public InterventionExecutionsController(
            IInterventionExecutionRepository repo,
            INotificationService notify,
            ICurrentUser me,
            HelpDeskDbContext db)
        {
            _repo = repo;
            _notify = notify;
            _me = me;
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> List(
            [FromQuery] string? status,
            [FromQuery] string? agent,
            [FromQuery] string? client,
            [FromQuery] string? search)
        {
            InterventionStatut? statusFilter = null;
            if (Enum.TryParse<InterventionStatut>(status, true, out var s)) statusFilter = s;

            string? agentFilter = agent;
            string? clientFilter = client;

            // Role-based scoping
            if (_me.IsInRole(Roles.Agent)) agentFilter = _me.Id;
            else if (_me.IsInRole(Roles.Client, Roles.SubClient)) clientFilter = _me.Id;

            var list = await _repo.ListAsync(agentFilter, clientFilter, statusFilter, search);
            return Ok(list);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var e = await _repo.GetByIdAsync(id);
            if (e == null) return NotFound();
            if (!CanAccess(e)) return Forbid();
            return Ok(e);
        }

        [HttpPost]
        [Authorize(Roles = Roles.Staff)]
        public async Task<IActionResult> Create([FromBody] CreateInterventionDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Titre) || string.IsNullOrWhiteSpace(dto.ClientId))
                return BadRequest(new { error = "Titre and ClientId are required." });

            var entity = new InterventionExecution
            {
                TicketId = dto.TicketId,
                InterventionCatalogId = dto.InterventionCatalogId,
                ClientId = dto.ClientId,
                SousClientId = dto.SousClientId,
                AssignedAgentId = dto.AssignedAgentId,
                Titre = dto.Titre,
                Description = dto.Description,
                Categorie = dto.Categorie,
                Priorite = dto.Priorite,
                ScheduledAt = dto.ScheduledAt,
                Location = dto.Location,
                IsRemote = dto.IsRemote,
                Statut = dto.ScheduledAt.HasValue ? InterventionStatut.Scheduled : InterventionStatut.Pending,
                CreatedById = _me.Id ?? "system"
            };

            var created = await _repo.CreateAsync(entity);

            // Notify assigned agent
            if (!string.IsNullOrEmpty(created.AssignedAgentId))
            {
                await _notify.NotifyAsync(new NotifyPayload(
                    RecipientUserId: created.AssignedAgentId,
                    Type: NotificationType.InterventionAssigned,
                    Title: "Nouvelle intervention assignée",
                    Message: $"Vous avez été assigné à l'intervention \"{created.Titre}\".",
                    InterventionId: created.Id,
                    TicketId: created.TicketId,
                    ActorUserId: _me.Id));
            }
            // Notify client when scheduled
            if (created.Statut == InterventionStatut.Scheduled && !string.IsNullOrEmpty(created.ClientId))
            {
                await _notify.NotifyAsync(new NotifyPayload(
                    RecipientUserId: created.ClientId,
                    Type: NotificationType.InterventionScheduled,
                    Title: "Intervention planifiée",
                    Message: $"Une intervention \"{created.Titre}\" a été planifiée pour {created.ScheduledAt:dd/MM/yyyy HH:mm}.",
                    InterventionId: created.Id,
                    ActorUserId: _me.Id));
            }

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = Roles.Staff)]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateInterventionDto dto)
        {
            var entity = await _repo.GetByIdAsync(id);
            if (entity == null) return NotFound();

            entity.Titre = dto.Titre;
            entity.Description = dto.Description;
            entity.Categorie = dto.Categorie;
            entity.Priorite = dto.Priorite;
            entity.ScheduledAt = dto.ScheduledAt;
            entity.Location = dto.Location;
            entity.IsRemote = dto.IsRemote;
            entity.TicketId = dto.TicketId;
            entity.InterventionCatalogId = dto.InterventionCatalogId;
            await _repo.UpdateAsync(entity);
            return NoContent();
        }

        [HttpPatch("{id:int}/assign")]
        [Authorize(Roles = Roles.Staff)]
        public async Task<IActionResult> Assign(int id, [FromBody] AssignAgentDto dto)
        {
            var entity = await _repo.GetByIdAsync(id);
            if (entity == null) return NotFound();
            var previous = entity.AssignedAgentId;

            var ok = await _repo.AssignAsync(id, dto.AgentId);
            if (!ok) return NotFound();

            if (!string.IsNullOrEmpty(dto.AgentId) && dto.AgentId != previous)
            {
                await _notify.NotifyAsync(new NotifyPayload(
                    RecipientUserId: dto.AgentId,
                    Type: NotificationType.InterventionAssigned,
                    Title: "Intervention assignée",
                    Message: $"Vous avez été assigné à l'intervention #{id}.",
                    InterventionId: id,
                    TicketId: entity.TicketId,
                    ActorUserId: _me.Id));
            }
            return NoContent();
        }

        [HttpPatch("{id:int}/status")]
        [Authorize(Roles = Roles.Staff)]
        public async Task<IActionResult> ChangeStatus(int id, [FromBody] ChangeStatusDto dto)
        {
            var entity = await _repo.GetByIdAsync(id);
            if (entity == null) return NotFound();

            var ok = await _repo.ChangeStatusAsync(id, dto.Status);
            if (!ok) return NotFound();

            switch (dto.Status)
            {
                case InterventionStatut.Scheduled when !string.IsNullOrEmpty(entity.ClientId):
                    await _notify.NotifyAsync(new NotifyPayload(
                        RecipientUserId: entity.ClientId,
                        Type: NotificationType.InterventionScheduled,
                        Title: "Intervention planifiée",
                        Message: $"L'intervention #{id} est planifiée.",
                        InterventionId: id,
                        ActorUserId: _me.Id));
                    break;
                case InterventionStatut.Completed:
                    if (!string.IsNullOrEmpty(entity.ClientId))
                        await _notify.NotifyAsync(new NotifyPayload(
                            RecipientUserId: entity.ClientId,
                            Type: NotificationType.InterventionCompleted,
                            Title: "Intervention terminée",
                            Message: $"L'intervention #{id} est terminée.",
                            InterventionId: id,
                            ActorUserId: _me.Id));
                    if (!string.IsNullOrEmpty(entity.AssignedAgentId) && entity.AssignedAgentId != _me.Id)
                        await _notify.NotifyAsync(new NotifyPayload(
                            RecipientUserId: entity.AssignedAgentId,
                            Type: NotificationType.InterventionCompleted,
                            Title: "Intervention terminée",
                            Message: $"L'intervention #{id} a été marquée terminée.",
                            InterventionId: id,
                            ActorUserId: _me.Id));
                    break;
                case InterventionStatut.Cancelled:
                    if (!string.IsNullOrEmpty(entity.AssignedAgentId))
                        await _notify.NotifyAsync(new NotifyPayload(
                            RecipientUserId: entity.AssignedAgentId,
                            Type: NotificationType.InterventionCancelled,
                            Title: "Intervention annulée",
                            Message: $"L'intervention #{id} a été annulée.",
                            InterventionId: id,
                            ActorUserId: _me.Id));
                    break;
            }
            return NoContent();
        }

        [HttpPost("{id:int}/report")]
        [Authorize(Roles = Roles.Staff)]
        public async Task<IActionResult> Report(int id, [FromBody] ReportDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Report))
                return BadRequest(new { error = "Report is required." });
            var entity = await _repo.GetByIdAsync(id);
            if (entity == null) return NotFound();
            var ok = await _repo.CompleteWithReportAsync(id, dto.Report);
            if (!ok) return NotFound();

            if (!string.IsNullOrEmpty(entity.ClientId))
                await _notify.NotifyAsync(new NotifyPayload(
                    RecipientUserId: entity.ClientId,
                    Type: NotificationType.InterventionCompleted,
                    Title: "Intervention terminée",
                    Message: $"L'intervention #{id} est clôturée avec un rapport.",
                    InterventionId: id,
                    ActorUserId: _me.Id));
            return NoContent();
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> Delete(int id)
        {
            await _repo.DeleteAsync(id);
            return NoContent();
        }

        private bool CanAccess(InterventionExecution e)
        {
            if (_me.IsInRole(Roles.Admin)) return true;
            if (_me.IsInRole(Roles.Agent)) return e.AssignedAgentId == _me.Id || e.CreatedById == _me.Id;
            if (_me.IsInRole(Roles.Client)) return e.ClientId == _me.Id;
            if (_me.IsInRole(Roles.SubClient)) return e.SousClientId == _me.Id;
            return false;
        }
    }
}
