using LoviTask.Application.Interfaces;
using LoviTask.Domain.Events;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace LoviTask.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    private readonly IBehaviorRepository _behaviorRepository;

    public EventsController(IBehaviorRepository behaviorRepository)
    {
        _behaviorRepository = behaviorRepository;
    }

    [HttpGet]
    public IActionResult GetEvents()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value 
                     ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value 
                     ?? User.Identity?.Name 
                     ?? "default-user";
        var events = _behaviorRepository.GetEvents(userId);
        return Ok(events);
    }
}
