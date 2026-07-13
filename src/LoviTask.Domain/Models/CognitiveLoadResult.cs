namespace LoviTask.Domain.Models;

public sealed class CognitiveLoadResult
{
    public double Score { get; set; }
    public string Classification { get; set; } = string.Empty;
    public string MitigationAdvice { get; set; } = string.Empty;
    public int ActiveTasksCount { get; set; }
    public int DelayedTasksCount { get; set; }
    public int RecentInterruptionCount { get; set; }
    public double? UserEnergyLevel { get; set; }
}
