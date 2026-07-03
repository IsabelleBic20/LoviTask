namespace LoviTask.Domain.Models;

public sealed class MicrotaskSuggestion
{
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string Priority { get; init; } = string.Empty;
}
