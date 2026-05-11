using System.Security.Claims;

namespace ModuleHelpDesk.Services
{
    public class CurrentUser : ICurrentUser
    {
        private readonly IHttpContextAccessor _accessor;
        public CurrentUser(IHttpContextAccessor accessor) => _accessor = accessor;

        private ClaimsPrincipal? Principal => _accessor.HttpContext?.User;

        public string? Id => Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
        public string? Email => Principal?.FindFirstValue(ClaimTypes.Email);
        public string? Role => Principal?.FindFirstValue(ClaimTypes.Role);
        public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated ?? false;

        public bool IsInRole(params string[] roles)
        {
            var role = Role;
            if (string.IsNullOrEmpty(role)) return false;
            foreach (var r in roles)
                if (string.Equals(r, role, StringComparison.OrdinalIgnoreCase)) return true;
            return false;
        }
    }
}
