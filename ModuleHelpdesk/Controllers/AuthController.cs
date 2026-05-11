using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ModuleHelpDesk.Services;

namespace ModuleHelpDesk.Controllers
{
    [ApiController]
    [Route("api/helpdesk/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _auth;
        private readonly ICurrentUser _me;

        public AuthController(IAuthService auth, ICurrentUser me)
        {
            _auth = auth;
            _me = me;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
                return BadRequest(new { error = "Email and password are required." });

            var resp = await _auth.LoginAsync(req);
            if (resp == null) return Unauthorized(new { error = "Invalid credentials." });
            return Ok(resp);
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password) || string.IsNullOrWhiteSpace(req.Role))
                return BadRequest(new { error = "Email, password and role are required." });
            try
            {
                var cred = await _auth.RegisterAsync(req);
                return Created($"/api/helpdesk/auth/users/{cred.Id}", new { id = cred.Id, email = cred.Email, role = cred.Role });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { error = ex.Message });
            }
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            if (!_me.IsAuthenticated || string.IsNullOrEmpty(_me.Id))
                return Unauthorized();
            var dto = await _auth.GetMeAsync(_me.Id);
            return dto == null ? Unauthorized() : Ok(dto);
        }

        [HttpPost("logout")]
        [Authorize]
        public IActionResult Logout() => Ok(new { ok = true });
    }
}
