namespace LoviTask.Domain.Models;

public sealed class MoodPattern
{
    public string DayOfWeek { get; init; } = string.Empty;
    public string MoodSummary { get; init; } = string.Empty;
}
