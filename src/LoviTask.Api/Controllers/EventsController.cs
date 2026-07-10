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
        var events = _behaviorRepository.GetEvents();
        return Ok(events);
    }
}
