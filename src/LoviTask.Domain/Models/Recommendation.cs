namespace LoviTask.Domain.Models;

public sealed class Recommendation
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Explanation { get; set; } = string.Empty;
}
