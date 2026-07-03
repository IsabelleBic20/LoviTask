using LoviTask.Application.Interfaces;
using LoviTask.Domain.Models;

namespace LoviTask.Infrastructure.Services;

public class BrainDumpAnalyzer : IBrainDumpAnalyzer
{
    public MicrotaskSuggestion[] AnalyzeBrainDump(string brainDumpText)
    {
        if (string.IsNullOrWhiteSpace(brainDumpText))
        {
            return Array.Empty<MicrotaskSuggestion>();
        }

        var lines = brainDumpText
            .Split(new[] { '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(line => line.Trim())
            .Where(line => line.Length > 0)
            .ToArray();

        var suggestions = new List<MicrotaskSuggestion>();

        foreach (var line in lines)
        {
            if (line.Length < 20)
            {
                suggestions.Add(new MicrotaskSuggestion
                {
                    Title = line,
                    Description = "Transforme isso em uma pequena ação prática.",
                    Priority = "Média"
                });
            }
            else
            {
                suggestions.Add(new MicrotaskSuggestion
                {
                    Title = line.Length > 60 ? line[..60] + "..." : line,
                    Description = "Divida esta ideia em um passo específico e de curto prazo.",
                    Priority = line.Contains("urgente", StringComparison.OrdinalIgnoreCase)
                        ? "Alta"
                        : "Média"
                });
            }
        }

        if (!suggestions.Any())
        {
            suggestions.Add(new MicrotaskSuggestion
            {
                Title = "Revisar o Brain Dump",
                Description = "Tente transformar seu texto em pelo menos uma ação concreta.",
                Priority = "Média"
            });
        }

        return suggestions.ToArray();
    }
}
