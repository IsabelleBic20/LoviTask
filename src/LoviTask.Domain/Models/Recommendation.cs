namespace LoviTask.Domain.Models;

public sealed class Recommendation
{
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
}
