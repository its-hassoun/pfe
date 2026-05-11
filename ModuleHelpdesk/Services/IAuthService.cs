using ModuleHelpDesk.Models;

namespace ModuleHelpDesk.Services
{
    public record LoginRequest(string Email, string Password);
    public record RegisterRequest(string Email, string Password, string Role, string? UserId);
    public record AuthUserDto(string Id, string Email, string Role, string? Name, string? AvatarInitials);
    public record LoginResponse(string Token, AuthUserDto User, DateTime ExpiresAt);

    public interface IAuthService
    {
        Task<LoginResponse?> LoginAsync(LoginRequest req);
        Task<UserCredential> RegisterAsync(RegisterRequest req);
        Task<AuthUserDto?> GetMeAsync(string userId);
    }
}
