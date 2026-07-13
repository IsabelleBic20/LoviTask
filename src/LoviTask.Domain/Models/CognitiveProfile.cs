using System;

namespace LoviTask.Domain.Models;

public sealed class CognitiveProfile
{
    public string UserId { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    
    // Novas métricas comportamentais exigidas
    public string BestProductivityHour { get; set; } = string.Empty;
    public string WorstProductivityHour { get; set; } = string.Empty;
    public double AverageTaskDuration { get; set; }
    public double AverageFocusTime { get; set; }
    public double CompletionRate { get; set; }
    public double DelayRate { get; set; }
    public double ProcrastinationIndex { get; set; }
    public double CognitiveLoad { get; set; }
    public double ConsistencyScore { get; set; }
    public DateTime LastUpdated { get; set; }

    // Compatibilidade com o mapeamento e recursos anteriores
    public ProductivityWindow ProductivityWindow { get; set; } = new();
    public ProductivityWindow LowProductivityWindow { get; set; } = new();
    public Recommendation[] Recommendations { get; set; } = Array.Empty<Recommendation>();
    public HabitEvolution[] HabitEvolution { get; set; } = Array.Empty<HabitEvolution>();
    public EnergyPattern[] EnergyPatterns { get; set; } = Array.Empty<EnergyPattern>();
    public MoodPattern[] MoodPatterns { get; set; } = Array.Empty<MoodPattern>();
}
