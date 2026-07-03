using LoviTask.Domain.Events;
using LoviTask.Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace LoviTask.Api.Controllers;

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
