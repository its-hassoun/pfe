using ModuleHelpDesk.Models;

namespace ModuleHelpDesk.Services
{
    public record NotifyPayload(
        string RecipientUserId,
        NotificationType Type,
        string Title,
        string Message,
        int? TicketId = null,
        int? InterventionId = null,
        string? ActorUserId = null,
        object? Metadata = null
    );

    public interface INotificationService
    {
        Task<Notification> NotifyAsync(NotifyPayload payload);
        Task NotifyManyAsync(IEnumerable<NotifyPayload> payloads);
        Task<IEnumerable<Notification>> ListAsync(string recipientUserId, bool unreadOnly, int take, int skip);
        Task<int> UnreadCountAsync(string recipientUserId);
        Task<bool> MarkReadAsync(int id, string recipientUserId);
        Task<int> MarkAllReadAsync(string recipientUserId);
        Task<bool> DeleteAsync(int id, string recipientUserId);
    }
}
