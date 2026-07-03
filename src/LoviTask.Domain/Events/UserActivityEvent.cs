namespace LoviTask.Domain.Events;

public sealed class UserActivityEvent
{
    public string UserId { get; init; } = string.Empty;
    public string EventType { get; init; } = string.Empty;
    public DateTime Timestamp { get; init; }
    public string? Description { get; init; }
    public string? Category { get; init; }
    public int? EstimatedMinutes { get; init; }
    public double? EnergyLevel { get; init; }
    public string? Mood { get; init; }
    public bool? Completed { get; init; }
}
