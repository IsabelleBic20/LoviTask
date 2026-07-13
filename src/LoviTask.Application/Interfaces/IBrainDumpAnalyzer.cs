using LoviTask.Application.Models;
using LoviTask.Domain.Models;

namespace LoviTask.Application.Interfaces;

public interface IBrainDumpAnalyzer
{
    MicrotaskSuggestion[] AnalyzeBrainDump(BrainDumpContext context);
}
