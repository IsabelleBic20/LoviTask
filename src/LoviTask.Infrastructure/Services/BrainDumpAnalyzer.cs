using LoviTask.Application.Interfaces;
using LoviTask.Application.Models;
using LoviTask.Domain.Models;

namespace LoviTask.Infrastructure.Services;

public class BrainDumpAnalyzer : IBrainDumpAnalyzer
{
    private static readonly string[] HighPriorityKeywords =
    {
        "urgente", "agora", "hoje", "imediato", "crítico", "prioridade", "preciso"
    };

    private static readonly string[] LowPriorityKeywords =
    {
        "depois", "mais tarde", "fim de semana", "quando puder", "um dia", "mais adiante"
    };

    public MicrotaskSuggestion[] AnalyzeBrainDump(BrainDumpContext context)
    {
        if (context is null || string.IsNullOrWhiteSpace(context.Text))
        {
            return new[]
            {
                new MicrotaskSuggestion
                {
                    Title = "Revisar o Brain Dump",
                    Description = "Tente transformar seu texto em pelo menos uma ação concreta.",
                    Priority = "Média"
                }
            };
        }

        var ideas = ExtractIdeas(context.Text);
        if (!ideas.Any())
        {
            return new[]
            {
                new MicrotaskSuggestion
                {
                    Title = "Revisar o Brain Dump",
                    Description = "Tente transformar seu texto em pelo menos uma ação concreta.",
                    Priority = "Média"
                }
            };
        }

        return ideas
            .Select(idea => CreateSuggestion(idea, context))
            .ToArray();
    }

    private static string[] ExtractIdeas(string brainDumpText)
    {
        return brainDumpText
            .Split(new[] { '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries)
            .SelectMany(line => line.Split(new[] { '.', '!', '?' }, StringSplitOptions.RemoveEmptyEntries))
            .Select(line => line.Trim())
            .Where(line => line.Length > 0)
            .ToArray();
    }

    private static MicrotaskSuggestion CreateSuggestion(string idea, BrainDumpContext context)
    {
        var title = SummarizeTitle(idea);
        var priority = DeterminePriority(idea, context.Deadline);
        var description = BuildDescription(idea, priority, context.Goal, context.Deadline);

        return new MicrotaskSuggestion
        {
            Title = title,
            Description = description,
            Priority = priority
        };
    }

    private static string SummarizeTitle(string idea)
    {
        var cleaned = idea.Trim();
        if (cleaned.Length <= 60)
        {
            return cleaned;
        }

        return cleaned[..60] + "...";
    }

    private static string DeterminePriority(string idea, DateTime? deadline)
    {
        var normalized = idea.ToLowerInvariant();

        if (HighPriorityKeywords.Any(keyword => normalized.Contains(keyword, StringComparison.OrdinalIgnoreCase)))
        {
            return "Alta";
        }

        if (deadline.HasValue)
        {
            var daysUntilDeadline = (deadline.Value.Date - DateTime.UtcNow.Date).TotalDays;
            if (daysUntilDeadline < 0)
            {
                return "Alta";
            }

            if (daysUntilDeadline <= 2)
            {
                return "Alta";
            }

            if (daysUntilDeadline <= 7)
            {
                return "Média";
            }
        }

        if (LowPriorityKeywords.Any(keyword => normalized.Contains(keyword, StringComparison.OrdinalIgnoreCase)))
        {
            return "Baixa";
        }

        if (normalized.Contains("amanhã", StringComparison.OrdinalIgnoreCase) ||
            normalized.Contains("hoje à tarde", StringComparison.OrdinalIgnoreCase) ||
            normalized.Contains("esta semana", StringComparison.OrdinalIgnoreCase))
        {
            return "Média";
        }

        return "Média";
    }

    private static string BuildDescription(string idea, string priority, string? goal, DateTime? deadline)
    {
        var baseDescription = priority switch
        {
            "Alta" => "Comece por isso agora para reduzir a carga mental. Identifique o primeiro passo e execute-o em seguida.",
            "Baixa" => "Planeje esta atividade para um momento mais tranquilo. Divida em um passo simples antes de agendar.",
            _ => "Transforme esta ideia em um passo curto e específico para manter o fluxo de trabalho consistente."
        };

        var addedContext = new List<string>();

        if (!string.IsNullOrWhiteSpace(goal))
        {
            addedContext.Add($"Este passo avança a meta \"{goal}\".");
        }

        if (deadline.HasValue)
        {
            var daysUntilDeadline = (deadline.Value.Date - DateTime.UtcNow.Date).TotalDays;
            if (daysUntilDeadline < 0)
            {
                addedContext.Add("O prazo já passou; priorize imediatamente.");
            }
            else if (daysUntilDeadline <= 2)
            {
                addedContext.Add("O prazo está próximo, trate como prioridade alta.");
            }
            else if (daysUntilDeadline <= 7)
            {
                addedContext.Add("Prazo próximo, mantenha o ritmo consistente para chegar a tempo.");
            }
        }

        if (!addedContext.Any())
        {
            return baseDescription;
        }

        return baseDescription + " " + string.Join(" ", addedContext);
    }
}
