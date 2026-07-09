using LoviTask.Application.Models;
using LoviTask.Infrastructure.Services;
using LoviTask.Domain.Models;

namespace LoviTask.Tests;

public class BrainDumpAnalyzerTests
{
    [Fact]
    public void AnalyzeBrainDump_ReturnsHighPriorityForUrgentRequests()
    {
        var analyzer = new BrainDumpAnalyzer();
        var context = new BrainDumpContext
        {
            Text = "Enviar proposta urgente para cliente hoje. Rever orçamento e alinhar com o time."
        };

        var suggestions = analyzer.AnalyzeBrainDump(context);

        Assert.Equal(2, suggestions.Length);
        Assert.Equal("Alta", suggestions[0].Priority);
        Assert.Contains("Enviar proposta urgente", suggestions[0].Title, StringComparison.OrdinalIgnoreCase);
        Assert.Equal("Média", suggestions[1].Priority);
    }

    [Fact]
    public void AnalyzeBrainDump_AssignsLowPriorityForLaterActivities()
    {
        var analyzer = new BrainDumpAnalyzer();
        var context = new BrainDumpContext
        {
            Text = "Planejar roteiro da viagem no fim de semana. Configurar lembrete para mais tarde."
        };

        var suggestions = analyzer.AnalyzeBrainDump(context);

        Assert.Equal(2, suggestions.Length);
        Assert.Equal("Baixa", suggestions[0].Priority);
        Assert.Equal("Baixa", suggestions[1].Priority);
        Assert.Contains("Planejar roteiro da viagem", suggestions[0].Title, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void AnalyzeBrainDump_BreaksTextIntoClearMicrotasks()
    {
        var analyzer = new BrainDumpAnalyzer();
        var context = new BrainDumpContext
        {
            Text = "Revisar o relatório de vendas. Ligar para o fornecedor. Preparar a apresentação da reunião de sexta-feira."
        };

        var suggestions = analyzer.AnalyzeBrainDump(context);

        Assert.Equal(3, suggestions.Length);
        Assert.All(suggestions, suggestion => Assert.False(string.IsNullOrWhiteSpace(suggestion.Title)));
        Assert.All(suggestions, suggestion => Assert.True(
            suggestion.Description.Contains("Transforme", StringComparison.OrdinalIgnoreCase) ||
            suggestion.Description.Contains("Comece", StringComparison.OrdinalIgnoreCase) ||
            suggestion.Description.Contains("Planeje", StringComparison.OrdinalIgnoreCase),
            $"Unexpected description: {suggestion.Description}"));
    }

    [Fact]
    public void AnalyzeBrainDump_UsesGoalAndDeadlineToAdjustPriorityAndDescription()
    {
        var analyzer = new BrainDumpAnalyzer();
        var context = new BrainDumpContext
        {
            Text = "Enviar relatório final para revisão.",
            Goal = "Fechar prestação de contas",
            Deadline = DateTime.UtcNow.AddDays(1)
        };

        var suggestions = analyzer.AnalyzeBrainDump(context);

        Assert.Single(suggestions);
        Assert.Equal("Alta", suggestions[0].Priority);
        Assert.Contains("Fechar prestação de contas", suggestions[0].Description, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("prazo", suggestions[0].Description, StringComparison.OrdinalIgnoreCase);
    }
}
