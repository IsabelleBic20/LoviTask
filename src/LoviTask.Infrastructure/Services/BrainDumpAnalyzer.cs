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

    private static readonly System.Text.RegularExpressions.Regex EmotionalPreambleRegex = new(
        @"^(?:estou\b\s+(?:muito\b\s+|super\b\s+|meio\b\s+|bem\b\s+)?(?:ansioso|ansiosa|preocupado|preocupada|estressado|estressada|cansado|cansada|nervoso|nervosa|tenso|tensa|desanimado|desanimada)\b[\s,]*)+",
        System.Text.RegularExpressions.RegexOptions.IgnoreCase);

    private static readonly System.Text.RegularExpressions.Regex HelperVerbRegex = new(
        @"^(?:preciso|tenho\s+que|tenho\s+de|quero|gostaria\s+de|devo|vou|não\s+(?:posso\s+)?esquecer\s+de|lembrar\s+de|esquecer\s+de)\b[\s,]+(?=\b\w+(?:ar|er|ir|ôr)\b)",
        System.Text.RegularExpressions.RegexOptions.IgnoreCase);

    private static readonly System.Text.RegularExpressions.Regex LeadingFillersRegex = new(
        @"^(?:porque|pois|já\s+que|ja\s+que|como|mas|também|tambem|que|e)\b[\s,]*",
        System.Text.RegularExpressions.RegexOptions.IgnoreCase);

    private static readonly System.Text.RegularExpressions.Regex DespairOrEmotionalRegex = new(
        @"^(?:não\s+sei\s+por\s+onde\s+começar|nao\s+sei\s+por\s+onde\s+começar|não\s+sei\s+o\s+que\s+fazer|nao\s+sei\s+o\s+que\s+fazer|estou\s+perdido|estou\s+perdida|estou\s+confuso|estou\s+confusa|sem\s+saber\s+por\s+onde\s+começar|sem\s+saber\s+o\s+que\s+fazer|não\s+sei\s+como\s+fazer|nao\s+sei\s+como\s+fazer|estou\s+sem\s+rumo|não\s+consigo\s+me\s+organizar|nao\s+consigo\s+me\s+organizar|não\s+sei|nao\s+sei|estou\s+ansioso|estou\s+ansiosa|estou\s+preocupado|estou\s+preocupada|estou\s+estressado|estou\s+estressada|estou\s+cansado|estou\s+cansada|estou\s+nervoso|estou\s+nervosa|estou\s+tenso|estou\s+tensa|estou\s+desanimado|estou\s+desanimada)$",
        System.Text.RegularExpressions.RegexOptions.IgnoreCase);

    private static string CleanPart(string part)
    {
        if (string.IsNullOrWhiteSpace(part)) return string.Empty;

        string previous;
        do
        {
            previous = part;
            part = EmotionalPreambleRegex.Replace(part, "").Trim();
            part = LeadingFillersRegex.Replace(part, "").Trim();
            part = HelperVerbRegex.Replace(part, "").Trim();
        } while (part != previous);

        return part;
    }

    private static bool IsDespairOrEmotional(string part)
    {
        return DespairOrEmotionalRegex.IsMatch(part);
    }


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
        if (string.IsNullOrWhiteSpace(brainDumpText)) return System.Array.Empty<string>();

        // 1. Dividir primeiro por quebra de linha e pontuações fortes (. ! ?)
        var lines = brainDumpText
            .Split(new[] { '\n', '\r', '.', '!', '?' }, System.StringSplitOptions.RemoveEmptyEntries)
            .Select(line => line.Trim())
            .Where(line => line.Length > 0);

        var finalIdeas = new System.Collections.Generic.List<string>();

        // 2. Para cada linha, quebrar usando conectores comuns que indicam múltiplas tarefas
        // Conectores: " e também ", " bem como ", " além de ", " depois de ", " depois ", " e ", ",", ";"
        var connectorsRegex = new System.Text.RegularExpressions.Regex(
            @"\s+(?:e\s+também|bem\s+como|além\s+de|depois\s+de|depois|e)\s+|[,;]\s*",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);

        foreach (var line in lines)
        {
            var cleanedLine = CleanPart(line);

            if (cleanedLine.Length == 0 || IsDespairOrEmotional(cleanedLine)) continue;

            var parts = connectorsRegex.Split(cleanedLine)
                .Select(p => p.Trim())
                .Where(p => p.Length > 0)
                .ToArray();

            if (parts.Length == 0) continue;

            // O primeiro item define o contexto e a ação inicial
            var firstPart = CleanPart(parts[0]);
            if (firstPart.Length >= 3 && !IsDespairOrEmotional(firstPart))
            {
                var capitalizedFirst = char.ToUpper(firstPart[0]) + firstPart[1..];
                finalIdeas.Add(capitalizedFirst);
            }

            if (parts.Length > 1)
            {
                var prefix = GetSharedPrefix(firstPart);
                for (int i = 1; i < parts.Length; i++)
                {
                    var part = CleanPart(parts[i]);
                    if (!ContainsVerb(part))
                    {
                        // Se não contém verbo, reconstrói usando o prefixo da primeira parte
                        part = prefix + " " + part;
                    }
                    part = CleanPart(part);
                    if (part.Length >= 3 && !IsDespairOrEmotional(part))
                    {
                        var capitalized = char.ToUpper(part[0]) + part[1..];
                        finalIdeas.Add(capitalized);
                    }
                }
            }
        }

        if (!finalIdeas.Any())
        {
            foreach (var line in lines)
            {
                var cleaned = CleanPart(line);
                if (cleaned.Length >= 3 && !IsDespairOrEmotional(cleaned))
                {
                    finalIdeas.Add(char.ToUpper(cleaned[0]) + cleaned[1..]);
                }
            }
        }

        return finalIdeas.ToArray();
    }

    private static bool ContainsVerb(string text)
    {
        // Heurística para verbos em português no contexto de lista de tarefas:
        // Palavras terminadas em ar, er, ir, ou ôr (como pôr), excluindo substantivos comuns.
        var verbRegex = new System.Text.RegularExpressions.Regex(
            @"\b(?!celular\b|lugar\b|par\b|lar\b|mar\b|ar\b|professor\b|mulher\b|computador\b|dor\b|amor\b)\w+(?:ar|er|ir|ôr)\b",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);

        return verbRegex.IsMatch(text);
    }

    private static string GetSharedPrefix(string part)
    {
        var words = part.Split(' ', System.StringSplitOptions.RemoveEmptyEntries);
        if (words.Length <= 1)
        {
            return part;
        }

        var connectionWords = new System.Collections.Generic.HashSet<string>(System.StringComparer.OrdinalIgnoreCase)
        {
            "para", "de", "com", "em", "sobre", "do", "da", "no", "na", "ao", "à", "pelo", "pela", "a", "o", "os", "as"
        };

        // Encontrar a última palavra de conexão que não seja a última palavra da frase
        int lastConnectionIndex = -1;
        for (int i = 0; i < words.Length - 1; i++)
        {
            if (connectionWords.Contains(words[i]))
            {
                lastConnectionIndex = i;
            }
        }

        if (lastConnectionIndex != -1)
        {
            return string.Join(" ", words.Take(lastConnectionIndex + 1));
        }

        // Caso padrão: assume o primeiro termo (geralmente o verbo principal)
        return words[0];
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
