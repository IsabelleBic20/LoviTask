using LoviTask.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace LoviTask.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MetricsController : ControllerBase
{
    private readonly IPersonalizationEngine _personalizationEngine;

    public MetricsController(IPersonalizationEngine personalizationEngine)
    {
        _personalizationEngine = personalizationEngine;
    }

    [HttpGet]
    public IActionResult GetMetrics()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value 
                     ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value 
                     ?? User.Identity?.Name 
                     ?? "default-user";
        var metrics = _personalizationEngine.BuildPersonalizationMetrics(userId);
        return Ok(metrics);
    }
}
