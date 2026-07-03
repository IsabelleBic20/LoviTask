using LoviTask.Application.Interfaces;
using LoviTask.Domain.Events;
using LoviTask.Domain.Models;

namespace LoviTask.Application.Services;

public class PersonalizationEngine : IPersonalizationEngine
{
    private readonly IBehaviorRepository _behaviorRepository;
    private readonly IBrainDumpAiProvider _brainDumpAiProvider;
    private readonly IPersonalizationMetricsProvider _metricsProvider;

    public PersonalizationEngine(
        IBehaviorRepository behaviorRepository,
        IBrainDumpAiProvider brainDumpAiProvider,
        IPersonalizationMetricsProvider metricsProvider)
    {
        _behaviorRepository = behaviorRepository;
        _brainDumpAiProvider = brainDumpAiProvider;
        _metricsProvider = metricsProvider;
    }

    public void TrackEvent(UserActivityEvent activityEvent)
    {
        _behaviorRepository.SaveEvent(activityEvent);
    }

    public CognitiveProfile BuildCognitiveProfile()
    {
        var history = _behaviorRepository.GetEvents().ToList();
        if (!history.Any())
        {
            return new CognitiveProfile
            {
                UserId = string.Empty,
                Summary = "Ainda não há dados suficientes, mas seu perfil cognitivo começará a crescer conforme você registrar mais atividades.",
                ProductivityWindow = new ProductivityWindow { Period = "Ainda em análise", Confidence = 0 },
                LowProductivityWindow = new ProductivityWindow { Period = "Ainda em análise", Confidence = 0 },
                EnergyPatterns = Array.Empty<EnergyPattern>(),
                MoodPatterns = Array.Empty<MoodPattern>(),
                Recommendations = Array.Empty<Recommendation>(),
                HabitEvolution = Array.Empty<HabitEvolution>()
            };
        }

        var completedEvents = history.Where(e => e.Completed == true).ToList();
        var abandonedEvents = history.Where(e => e.Completed == false).ToList();
        var averageCompletionMinutes = completedEvents
            .Where(e => e.EstimatedMinutes.HasValue)
            .Select(e => e.EstimatedMinutes!.Value)
            .DefaultIfEmpty(0)
            .Average();

        var productivityWindow = GetDominantPeriod(completedEvents);
        var lowProductivityWindow = GetDominantPeriod(abandonedEvents);

        return new CognitiveProfile
        {
            UserId = history.First().UserId,
            Summary = "Seu perfil cognitivo está sendo construído com base em seu ritmo real de trabalho, energia e humor.",
            ProductivityWindow = productivityWindow,
            LowProductivityWindow = lowProductivityWindow,
            EnergyPatterns = BuildEnergyPatterns(history),
            MoodPatterns = BuildMoodPatterns(history),
            Recommendations = GenerateRecommendations(history, completedEvents, abandonedEvents),
            HabitEvolution = BuildHabitEvolution(history)
        };
    }

    public Recommendation[] GenerateRecommendations()
    {
        var history = _behaviorRepository.GetEvents().ToList();
        var completedEvents = history.Where(e => e.Completed == true).ToList();
        var abandonedEvents = history.Where(e => e.Completed == false).ToList();
        return GenerateRecommendations(history, completedEvents, abandonedEvents);
    }

    public PersonalizationMetrics BuildPersonalizationMetrics()
    {
        var history = _behaviorRepository.GetEvents().ToList();
        return _metricsProvider.BuildMetrics(history);
    }

    private static ProductivityWindow GetDominantPeriod(IEnumerable<UserActivityEvent> events)
    {
        var group = events
            .GroupBy(e => GetTimeOfDay(e.Timestamp))
            .Select(g => new { Period = g.Key, Count = g.Count() })
            .OrderByDescending(g => g.Count)
            .FirstOrDefault();

        if (group is null)
        {
            return new ProductivityWindow { Period = "Ainda em análise", Confidence = 0 };
        }

        var total = events.Count();
        return new ProductivityWindow
        {
            Period = group.Period,
            Confidence = total > 0 ? Math.Round(group.Count / (double)total, 2) : 0
        };
    }

    private static string GetTimeOfDay(DateTime timestamp)
    {
        return timestamp.Hour switch
        {
            < 12 => "Manhã",
            < 18 => "Tarde",
            _ => "Noite"
        };
    }

    private static EnergyPattern[] BuildEnergyPatterns(IEnumerable<UserActivityEvent> history)
    {
        return history
            .Where(e => e.EnergyLevel.HasValue)
            .GroupBy(e => e.Timestamp.DayOfWeek)
            .Select(g => new EnergyPattern
            {
                DayOfWeek = g.Key.ToString(),
                EnergyLevel = DescribeEnergy(g.Average(e => e.EnergyLevel!.Value))
            })
            .OrderBy(p => p.DayOfWeek)
            .ToArray();
    }

    private static string DescribeEnergy(double averageEnergy)
    {
        if (averageEnergy >= 7) return "Alta";
        if (averageEnergy >= 4) return "Média";
        return "Baixa";
    }

    private static MoodPattern[] BuildMoodPatterns(IEnumerable<UserActivityEvent> history)
    {
        return history
            .Where(e => !string.IsNullOrWhiteSpace(e.Mood))
            .GroupBy(e => new { e.Timestamp.DayOfWeek, Mood = e.Mood! })
            .Select(g => new { g.Key.DayOfWeek, Mood = g.Key.Mood, Count = g.Count() })
            .GroupBy(g => g.DayOfWeek)
            .Select(g => g.OrderByDescending(x => x.Count).First())
            .Select(g => new MoodPattern
            {
                DayOfWeek = g.DayOfWeek.ToString(),
                MoodSummary = g.Mood
            })
            .OrderBy(p => p.DayOfWeek)
            .ToArray();
    }

    private static HabitEvolution[] BuildHabitEvolution(IEnumerable<UserActivityEvent> history)
    {
        var eventsByCategory = history.GroupBy(e => e.Category ?? "Sem categoria");
        return eventsByCategory
            .Select(g =>
            {
                var completed = g.Count(e => e.Completed == true);
                var total = g.Count();
                var lastWeek = g.Count(e => e.Timestamp >= DateTime.UtcNow.AddDays(-7));
                var previousWeek = g.Count(e => e.Timestamp < DateTime.UtcNow.AddDays(-7) && e.Timestamp >= DateTime.UtcNow.AddDays(-14));
                return new HabitEvolution
                {
                    HabitName = g.Key,
                    Consistency = total > 0 ? Math.Round(completed / (double)total, 2) : 0,
                    Trend = previousWeek == 0
                        ? "Em evolução"
                        : lastWeek >= previousWeek ? "Subindo" : "Estável"
                };
            })
            .OrderByDescending(h => h.Consistency)
            .Take(5)
            .ToArray();
    }

    private static Recommendation[] GenerateRecommendations(
        IEnumerable<UserActivityEvent> history,
        IReadOnlyList<UserActivityEvent> completedEvents,
        IReadOnlyList<UserActivityEvent> abandonedEvents)
    {
        var recommendations = new List<Recommendation>();
        var peakProductivity = GetDominantPeriod(completedEvents);
        var peakDistraction = GetDominantPeriod(abandonedEvents);

        if (peakProductivity.Period == "Noite")
        {
            recommendations.Add(new Recommendation
            {
                Title = "Aproveite seu pico noturno para atividades cognitivas",
                Description = "Você tende a concluir mais tarefas à noite; use esse tempo para atividades de concentração.",
                Category = "Foco"
            });
        }
        else if (peakProductivity.Period == "Tarde")
        {
            recommendations.Add(new Recommendation
            {
                Title = "Concentre tarefas analíticas na tarde",
                Description = "Seu ritmo mostra maior produtividade à tarde. Priorize estudos e trabalho criativo nesse período.",
                Category = "Produtividade"
            });
        }

        if (peakDistraction.Period == "Manhã")
        {
            recommendations.Add(new Recommendation
            {
                Title = "Adie tarefas domésticas para depois do almoço",
                Description = "A manhã tende a ser mais difícil para você; reserve ela para rotinas leves e comece o trabalho mais tarde.",
                Category = "Rotina"
            });
        }

        if (abandonedEvents.Any() && abandonedEvents.Count / (double)history.Count() > 0.25)
        {
            recommendations.Add(new Recommendation
            {
                Title = "Divida tarefas maiores em microtarefas",
                Description = "Quando várias atividades ficam pela metade, fragmentar os passos ajuda a manter o foco e completar mais rápido.",
                Category = "Foco"
            });
        }

        var shortTaskCompleted = completedEvents.Count(e => e.EstimatedMinutes.HasValue && e.EstimatedMinutes <= 10);
        if (shortTaskCompleted > 3)
        {
            recommendations.Add(new Recommendation
            {
                Title = "Use suas vitórias rápidas para ganhar impulso",
                Description = "Tarefas de até 10 minutos funcionam bem para você. Continue priorizando pequenos passos para manter a motivação.",
                Category = "Motivação"
            });
        }

        if (!recommendations.Any())
        {
            recommendations.Add(new Recommendation
            {
                Title = "Continue registrando suas atividades para recomendações cada vez melhores",
                Description = "Quanto mais eventos você compartilhar, mais o assistente entenderá seu ritmo e energia.",
                Category = "Apoio"
            });
        }

        return recommendations.ToArray();
    }
}
