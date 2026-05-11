using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ModuleHelpDesk.Services;

namespace ModuleHelpDesk.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/helpdesk/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _svc;
        private readonly ICurrentUser _me;

        public NotificationsController(INotificationService svc, ICurrentUser me)
        {
            _svc = svc;
            _me = me;
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] bool unreadOnly = false, [FromQuery] int take = 20, [FromQuery] int skip = 0)
        {
            if (string.IsNullOrEmpty(_me.Id)) return Unauthorized();
            var list = await _svc.ListAsync(_me.Id, unreadOnly, take, skip);
            return Ok(list);
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> UnreadCount()
        {
            if (string.IsNullOrEmpty(_me.Id)) return Unauthorized();
            return Ok(new { count = await _svc.UnreadCountAsync(_me.Id) });
        }

        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkRead(int id)
        {
            if (string.IsNullOrEmpty(_me.Id)) return Unauthorized();
            var ok = await _svc.MarkReadAsync(id, _me.Id);
            return ok ? NoContent() : NotFound();
        }

        [HttpPatch("read-all")]
        public async Task<IActionResult> MarkAllRead()
        {
            if (string.IsNullOrEmpty(_me.Id)) return Unauthorized();
            return Ok(new { count = await _svc.MarkAllReadAsync(_me.Id) });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (string.IsNullOrEmpty(_me.Id)) return Unauthorized();
            var ok = await _svc.DeleteAsync(id, _me.Id);
            return ok ? NoContent() : NotFound();
        }
    }
}
