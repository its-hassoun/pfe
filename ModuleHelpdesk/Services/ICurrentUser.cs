namespace ModuleHelpDesk.Services
{
    public interface ICurrentUser
    {
        string? Id { get; }
        string? Email { get; }
        string? Role { get; }
        bool IsAuthenticated { get; }
        bool IsInRole(params string[] roles);
    }
}
