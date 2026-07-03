using LoviTask.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace LoviTask.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BrainDumpController : ControllerBase
{
    private readonly IBrainDumpAnalyzer _brainDumpAnalyzer;

    public BrainDumpController(IBrainDumpAnalyzer brainDumpAnalyzer)
    {
        _brainDumpAnalyzer = brainDumpAnalyzer;
    }

    [HttpPost("analyze")]
    public IActionResult Analyze([FromBody] BrainDumpRequest request)
    {
        var suggestions = _brainDumpAnalyzer.AnalyzeBrainDump(request.Text);
        return Ok(suggestions);
    }
}

public sealed class BrainDumpRequest
{
    public string Text { get; init; } = string.Empty;
}
