namespace LoviTask.Domain.Models;

public sealed class PredictionResult
{
    public int TaskId { get; set; }
    public string TaskTitle { get; set; } = string.Empty;
    public double RiskPercentage { get; set; }
    public string Explanation { get; set; } = string.Empty;
}
