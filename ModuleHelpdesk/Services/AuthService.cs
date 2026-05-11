using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ModuleHelpDesk.Data;
using ModuleHelpDesk.Models;

namespace ModuleHelpDesk.Services
{
    public class AuthService : IAuthService
    {
        private readonly HelpDeskDbContext _db;
        private readonly IConfiguration _config;

        public AuthService(HelpDeskDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }

        public async Task<LoginResponse?> LoginAsync(LoginRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
                return null;

            var cred = await _db.UserCredentials
                .FirstOrDefaultAsync(c => c.Email == req.Email && c.IsActive);
            if (cred == null) return null;

            if (!BCrypt.Net.BCrypt.Verify(req.Password, cred.PasswordHash))
                return null;

            var profile = await ResolveProfileAsync(cred);
            var (token, expiresAt) = IssueToken(cred);
            return new LoginResponse(token, profile, expiresAt);
        }

        public async Task<UserCredential> RegisterAsync(RegisterRequest req)
        {
            if (await _db.UserCredentials.AnyAsync(c => c.Email == req.Email))
                throw new InvalidOperationException("Email already registered.");

            var cred = new UserCredential
            {
                UserId = req.UserId ?? Guid.NewGuid().ToString("N"),
                Email = req.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password, workFactor: 11),
                Role = req.Role,
                Kind = req.Role.Equals("Client", StringComparison.OrdinalIgnoreCase) || req.Role.Equals("SubClient", StringComparison.OrdinalIgnoreCase)
                    ? UserKind.Contact
                    : UserKind.Agent,
                IsActive = true
            };
            _db.UserCredentials.Add(cred);
            await _db.SaveChangesAsync();
            return cred;
        }

        public async Task<AuthUserDto?> GetMeAsync(string userId)
        {
            var cred = await _db.UserCredentials.FirstOrDefaultAsync(c => c.UserId == userId);
            return cred == null ? null : await ResolveProfileAsync(cred);
        }

        private async Task<AuthUserDto> ResolveProfileAsync(UserCredential cred)
        {
            string? name = null;
            string? initials = null;

            if (cred.Kind == UserKind.Agent && int.TryParse(cred.UserId, out var agentId))
            {
                var agent = await _db.Agents.FindAsync(agentId);
                if (agent != null)
                {
                    name = $"{agent.Prenom} {agent.Nom}".Trim();
                    initials = InitialsOf(agent.Prenom, agent.Nom);
                }
            }
            else if (cred.Kind == UserKind.Contact && int.TryParse(cred.UserId, out var contactId))
            {
                var contact = await _db.Contacts.FindAsync(contactId);
                if (contact != null)
                {
                    name = $"{contact.Prenom} {contact.Nom}".Trim();
                    initials = InitialsOf(contact.Prenom, contact.Nom);
                }
            }

            name ??= cred.Email;
            initials ??= cred.Email.Length >= 2 ? cred.Email[..2].ToUpperInvariant() : "U";
            return new AuthUserDto(cred.UserId, cred.Email, cred.Role, name, initials);
        }

        private static string InitialsOf(string prenom, string nom)
        {
            var p = string.IsNullOrEmpty(prenom) ? ' ' : prenom[0];
            var n = string.IsNullOrEmpty(nom) ? ' ' : nom[0];
            return ($"{p}{n}").ToUpperInvariant().Trim();
        }

        private (string token, DateTime expiresAt) IssueToken(UserCredential cred)
        {
            var section = _config.GetSection("Jwt");
            var secret = section["Secret"] ?? throw new InvalidOperationException("Jwt:Secret missing");
            var issuer = section["Issuer"] ?? "helpdesk-api";
            var audience = section["Audience"] ?? "helpdesk-frontend";
            var hours = int.TryParse(section["ExpiresHours"], out var h) ? h : 12;

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, cred.UserId),
                new(ClaimTypes.Email, cred.Email),
                new(ClaimTypes.Role, cred.Role),
                new("kind", cred.Kind.ToString())
            };

            var expires = DateTime.UtcNow.AddHours(hours);
            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: expires,
                signingCredentials: creds);
            var jwt = new JwtSecurityTokenHandler().WriteToken(token);
            return (jwt, expires);
        }
    }
}
