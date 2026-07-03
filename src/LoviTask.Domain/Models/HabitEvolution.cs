namespace LoviTask.Domain.Models;

public sealed class HabitEvolution
{
    public string HabitName { get; init; } = string.Empty;
    public double Consistency { get; init; }
    public string Trend { get; init; } = string.Empty;
}
