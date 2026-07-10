using LoviTask.Application.Interfaces;
using LoviTask.Application.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace LoviTask.Api.Controllers;

/// <summary>
/// Controlador que processa Brain Dumps e gera microtarefas inteligentes.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class BrainDumpController : ControllerBase
{
    private readonly IBrainDumpAnalyzer _brainDumpAnalyzer;

    public BrainDumpController(IBrainDumpAnalyzer brainDumpAnalyzer)
    {
        _brainDumpAnalyzer = brainDumpAnalyzer;
    }

    /// <summary>
    /// Analisa um Brain Dump e retorna sugestões de microtarefas com prioridades dinâmicas.
    /// </summary>
    /// <param name="request">Dados do Brain Dump, meta e prazo.</param>
    /// <returns>Lista de microtarefas sugeridas.</returns>
    [HttpPost("analyze")]
    public IActionResult Analyze([FromBody] BrainDumpRequest request)
    {
        var context = new BrainDumpContext
        {
            Text = request.Text,
            Goal = request.Goal,
            Deadline = request.Deadline
        };

        var suggestions = _brainDumpAnalyzer.AnalyzeBrainDump(context);
        return Ok(suggestions);
    }
}

/// <summary>
/// Requisição de Brain Dump para geração de microtarefas.
/// </summary>
public sealed class BrainDumpRequest
{
    /// <summary>
    /// Texto livre do Brain Dump.
    /// </summary>
    public string Text { get; init; } = string.Empty;

    /// <summary>
    /// Meta relacionada ao Brain Dump.
    /// </summary>
    public string? Goal { get; init; }

    /// <summary>
    /// Prazo desejado para conclusão da meta.
    /// </summary>
    public DateTime? Deadline { get; init; }
}
