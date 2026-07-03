using LoviTask.Domain.Models;

namespace LoviTask.Application.Interfaces;

public interface IBrainDumpAnalyzer
{
    MicrotaskSuggestion[] AnalyzeBrainDump(string brainDumpText);
}
