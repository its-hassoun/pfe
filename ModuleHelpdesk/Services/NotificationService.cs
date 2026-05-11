using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ModuleHelpDesk.Data;
using ModuleHelpDesk.Hubs;
using ModuleHelpDesk.Models;

namespace ModuleHelpDesk.Services
{
    public class NotificationService : INotificationService
    {
        private readonly HelpDeskDbContext _db;
        private readonly IHubContext<NotificationHub> _hub;

        public NotificationService(HelpDeskDbContext db, IHubContext<NotificationHub> hub)
        {
            _db = db;
            _hub = hub;
        }

        public async Task<Notification> NotifyAsync(NotifyPayload payload)
        {
            var n = new Notification
            {
                RecipientUserId = payload.RecipientUserId,
                ActorUserId = payload.ActorUserId,
                Type = payload.Type,
                Title = payload.Title,
                Message = payload.Message,
                TicketId = payload.TicketId,
                InterventionId = payload.InterventionId,
                Metadata = payload.Metadata == null ? null : JsonSerializer.Serialize(payload.Metadata),
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Notifications.Add(n);
            await _db.SaveChangesAsync();

            await _hub.Clients
                .Group(NotificationHub.GroupOf(payload.RecipientUserId))
                .SendAsync("notification:new", new
                {
                    n.Id,
                    n.RecipientUserId,
                    n.ActorUserId,
                    type = (int)n.Type,
                    typeName = n.Type.ToString(),
                    n.Title,
                    n.Message,
                    n.TicketId,
                    n.InterventionId,
                    n.Metadata,
                    n.IsRead,
                    n.CreatedAt
                });

            return n;
        }

        public async Task NotifyManyAsync(IEnumerable<NotifyPayload> payloads)
        {
            foreach (var p in payloads.Where(p => !string.IsNullOrEmpty(p.RecipientUserId)))
                await NotifyAsync(p);
        }

        public async Task<IEnumerable<Notification>> ListAsync(string recipientUserId, bool unreadOnly, int take, int skip)
        {
            var q = _db.Notifications.AsNoTracking()
                .Where(n => n.RecipientUserId == recipientUserId);
            if (unreadOnly) q = q.Where(n => !n.IsRead);
            return await q.OrderByDescending(n => n.CreatedAt)
                .Skip(skip)
                .Take(Math.Min(take, 100))
                .ToListAsync();
        }

        public Task<int> UnreadCountAsync(string recipientUserId) =>
            _db.Notifications.CountAsync(n => n.RecipientUserId == recipientUserId && !n.IsRead);

        public async Task<bool> MarkReadAsync(int id, string recipientUserId)
        {
            var n = await _db.Notifications.FirstOrDefaultAsync(x => x.Id == id && x.RecipientUserId == recipientUserId);
            if (n == null) return false;
            if (!n.IsRead)
            {
                n.IsRead = true;
                n.ReadAt = DateTime.UtcNow;
                n.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
                await _hub.Clients.Group(NotificationHub.GroupOf(recipientUserId))
                    .SendAsync("notification:read", new { id });
            }
            return true;
        }

        public async Task<int> MarkAllReadAsync(string recipientUserId)
        {
            var rows = await _db.Notifications
                .Where(n => n.RecipientUserId == recipientUserId && !n.IsRead)
                .ToListAsync();
            foreach (var n in rows)
            {
                n.IsRead = true;
                n.ReadAt = DateTime.UtcNow;
                n.UpdatedAt = DateTime.UtcNow;
            }
            if (rows.Count > 0)
            {
                await _db.SaveChangesAsync();
                await _hub.Clients.Group(NotificationHub.GroupOf(recipientUserId))
                    .SendAsync("notification:read_all", new { count = rows.Count });
            }
            return rows.Count;
        }

        public async Task<bool> DeleteAsync(int id, string recipientUserId)
        {
            var n = await _db.Notifications.FirstOrDefaultAsync(x => x.Id == id && x.RecipientUserId == recipientUserId);
            if (n == null) return false;
            _db.Notifications.Remove(n);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
