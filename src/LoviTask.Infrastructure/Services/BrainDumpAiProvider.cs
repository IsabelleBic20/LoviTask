using LoviTask.Application.Interfaces;

namespace LoviTask.Infrastructure.Services;

public class BrainDumpAiProvider : IBrainDumpAiProvider
{
    public string AnalyzeBrainDump(string brainDumpText)
    {
        return "Análise inicial do Brain Dump: detectado foco em prioridades e possíveis microtarefas a serem sugeridas.";
    }
}
