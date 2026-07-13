namespace LoviTask.Domain.Models;

public sealed class CognitiveHistoryDay
{
    public string Date { get; set; } = string.Empty; // YYYY-MM-DD
    public double AverageCognitiveLoad { get; set; }
    public double AverageEnergy { get; set; }
    public int TasksCompleted { get; set; }
    public int TasksDelayed { get; set; }
}
