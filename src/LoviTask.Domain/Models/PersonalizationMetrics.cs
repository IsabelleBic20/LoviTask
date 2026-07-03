namespace LoviTask.Domain.Models;

public sealed class PersonalizationMetrics
{
    public int TotalEvents { get; init; }
    public int CompletedEvents { get; init; }
    public int AbandonedEvents { get; init; }
    public double ProcrastinationRate { get; init; }
    public double AverageCompletionMinutes { get; init; }
    public string MostProductivePeriod { get; init; } = string.Empty;
    public string LeastProductivePeriod { get; init; } = string.Empty;
    public string MostFrequentCategory { get; init; } = string.Empty;
    public int ShortTaskCompleted { get; init; }
    public int LongTaskAbandoned { get; init; }
}
