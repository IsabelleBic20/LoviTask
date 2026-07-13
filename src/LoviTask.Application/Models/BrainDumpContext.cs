namespace LoviTask.Application.Models;

public sealed class BrainDumpContext
{
    public string Text { get; init; } = string.Empty;
    public string? Goal { get; init; }
    public DateTime? Deadline { get; init; }
}
