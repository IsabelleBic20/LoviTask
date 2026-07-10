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
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value 
                     ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value 
                     ?? User.Identity?.Name 
                     ?? "default-user";
        var authenticatedEvent = new UserActivityEvent
        {
            Id = activityEvent.Id,
            UserId = userId,
            EventType = activityEvent.EventType,
            Timestamp = activityEvent.Timestamp,
            Description = activityEvent.Description,
            Category = activityEvent.Category,
            EstimatedMinutes = activityEvent.EstimatedMinutes,
            EnergyLevel = activityEvent.EnergyLevel,
            Mood = activityEvent.Mood,
            Completed = activityEvent.Completed
        };
        _personalizationEngine.TrackEvent(authenticatedEvent);
        return Accepted();
    }

    [HttpGet("profile")]
    public IActionResult GetProfile()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value 
                     ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value 
                     ?? User.Identity?.Name 
                     ?? "default-user";
        var profile = _personalizationEngine.BuildCognitiveProfile(userId);
        return Ok(profile);
    }

    [HttpGet("recommendations")]
    public IActionResult GetRecommendations()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value 
                     ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value 
                     ?? User.Identity?.Name 
                     ?? "default-user";
        var recommendations = _personalizationEngine.GenerateRecommendations(userId);
        return Ok(recommendations);
    }
}
