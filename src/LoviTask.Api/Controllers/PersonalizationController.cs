using LoviTask.Application.Interfaces;
using LoviTask.Domain.Events;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace LoviTask.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PersonalizationController : ControllerBase
{
    private readonly IPersonalizationEngine _personalizationEngine;

    public PersonalizationController(IPersonalizationEngine personalizationEngine)
    {
        _personalizationEngine = personalizationEngine;
    }

    [HttpPost("events")]
    public IActionResult TrackEvent([FromBody] UserActivityEvent activityEvent)
    {
        _personalizationEngine.TrackEvent(activityEvent);
        return Accepted();
    }

    [HttpGet("profile")]
    public IActionResult GetProfile()
    {
        var profile = _personalizationEngine.BuildCognitiveProfile();
        return Ok(profile);
    }

    [HttpGet("recommendations")]
    public IActionResult GetRecommendations()
    {
        var recommendations = _personalizationEngine.GenerateRecommendations();
        return Ok(recommendations);
    }
}
