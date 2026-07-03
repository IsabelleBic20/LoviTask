namespace LoviTask.Domain.Models;

public sealed class CognitiveProfile
{
    public string UserId { get; init; } = string.Empty;
    public string Summary { get; init; } = string.Empty;
    public ProductivityWindow ProductivityWindow { get; init; } = new();
    public ProductivityWindow LowProductivityWindow { get; init; } = new();
    public Recommendation[] Recommendations { get; init; } = Array.Empty<Recommendation>();
    public HabitEvolution[] HabitEvolution { get; init; } = Array.Empty<HabitEvolution>();
    public EnergyPattern[] EnergyPatterns { get; init; } = Array.Empty<EnergyPattern>();
    public MoodPattern[] MoodPatterns { get; init; } = Array.Empty<MoodPattern>();
}
