namespace LoviTask.Domain.Models;

public sealed class ProductivityWindow
{
    public string Period { get; init; } = string.Empty;
    public double Confidence { get; init; }
}
