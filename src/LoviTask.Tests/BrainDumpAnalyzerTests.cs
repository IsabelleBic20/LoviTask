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

        Assert.Equal(3, suggestions.Length);
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
    public void AnalyzeBrainDump_EstouAnsiosaPrecisoEstudarParaPoscompEUnicamp()
    {
        var analyzer = new BrainDumpAnalyzer();
        var context = new BrainDumpContext
        {
            Text = "Estou ansiosa preciso estudar para poscomp e unicamp"
        };

        var suggestions = analyzer.AnalyzeBrainDump(context);

        Assert.Equal(2, suggestions.Length);
        Assert.Equal("Estudar para poscomp", suggestions[0].Title);
        Assert.Equal("Estudar para unicamp", suggestions[1].Title);
    }

    [Fact]
    public void AnalyzeBrainDump_EstudarParaPoscomp_PrecisoLavarRoupa_EstudarParaUniversidade()
    {
        var analyzer = new BrainDumpAnalyzer();
        var context = new BrainDumpContext
        {
            Text = "estudar para poscomp, preciso lavar roupa e estudar para universidade"
        };

        var suggestions = analyzer.AnalyzeBrainDump(context);

        // We expect it to split into 3 clear tasks:
        // 1. Estudar para poscomp
        // 2. Lavar roupa
        // 3. Estudar para universidade
        Assert.Equal(3, suggestions.Length);
        Assert.Equal("Estudar para poscomp", suggestions[0].Title);
        Assert.Equal("Lavar roupa", suggestions[1].Title); // Wait, "Preciso lavar roupa" or "Lavar roupa"? Let's see what it outputs.
        Assert.Equal("Estudar para universidade", suggestions[2].Title);
    }

    [Fact]
    public void AnalyzeBrainDump_FazerAcademia_EstouAnsiosaPorqueTambemTenhoQueEstudar()
    {
        var analyzer = new BrainDumpAnalyzer();
        var context = new BrainDumpContext
        {
            Text = "fazer academia, estou ansiosa porque tambem tenho que estudar"
        };

        var suggestions = analyzer.AnalyzeBrainDump(context);

        // We expect it to split into 2 clear tasks, cleaning up the emotional preamble and helper verb:
        // 1. Fazer academia
        // 2. Estudar
        Assert.Equal(2, suggestions.Length);
        Assert.Equal("Fazer academia", suggestions[0].Title);
        Assert.Equal("Estudar", suggestions[1].Title);
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
