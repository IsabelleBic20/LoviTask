using LoviTask.Application.Interfaces;
using LoviTask.Domain.Events;
using LoviTask.Domain.Models;

namespace LoviTask.Application.Services;

public class PersonalizationMetricsProvider : IPersonalizationMetricsProvider
{
    public PersonalizationMetrics BuildMetrics(IEnumerable<UserActivityEvent> history)
    {
        var events = history.ToList();
        var completed = events.Count(e => e.Completed == true);
        var abandoned = events.Count(e => e.Completed == false);
        var total = events.Count;
        var averageCompletionMinutes = events
            .Where(e => e.Completed == true && e.EstimatedMinutes.HasValue)
            .Select(e => e.EstimatedMinutes!.Value)
            .DefaultIfEmpty(0)
            .Average();

        return new PersonalizationMetrics
        {
            TotalEvents = total,
            CompletedEvents = completed,
            AbandonedEvents = abandoned,
            ProcrastinationRate = total > 0 ? Math.Round(abandoned / (double)total, 2) : 0,
            AverageCompletionMinutes = Math.Round(averageCompletionMinutes, 1),
            MostProductivePeriod = GetDominantPeriod(events.Where(e => e.Completed == true)),
            LeastProductivePeriod = GetDominantPeriod(events.Where(e => e.Completed == false)),
            MostFrequentCategory = events
                .GroupBy(e => e.Category ?? "Sem categoria")
                .OrderByDescending(g => g.Count())
                .Select(g => g.Key)
                .FirstOrDefault() ?? string.Empty,
            ShortTaskCompleted = events.Count(e => e.Completed == true && e.EstimatedMinutes.HasValue && e.EstimatedMinutes <= 10),
            LongTaskAbandoned = events.Count(e => e.Completed == false && e.EstimatedMinutes.HasValue && e.EstimatedMinutes > 60)
        };
    }

    private static string GetDominantPeriod(IEnumerable<UserActivityEvent> history)
    {
        var group = history
            .GroupBy(e => GetTimeOfDay(e.Timestamp))
            .Select(g => new { Period = g.Key, Count = g.Count() })
            .OrderByDescending(g => g.Count)
            .FirstOrDefault();

        return group?.Period ?? "Ainda em análise";
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
}
