namespace LoviTask.Domain.Models;

public sealed class EnergyPattern
{
    public string DayOfWeek { get; init; } = string.Empty;
    public string EnergyLevel { get; init; } = string.Empty;
}
