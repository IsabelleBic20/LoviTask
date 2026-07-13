using LoviTask.Application.Services;
using LoviTask.Domain.Events;
using LoviTask.Infrastructure.Repositories;
using LoviTask.Application.Interfaces;
using LoviTask.Domain.Models;

namespace LoviTask.Tests;

public class PersonalizationEngineTests
{
    [Fact]
    public void BuildCognitiveProfile_ReturnsEmptyProfile_WhenNoHistory()
    {
        var repository = new InMemoryBehaviorRepository();
        var metricsProvider = new PersonalizationMetricsProvider();
        var engine = new PersonalizationEngine(repository, NullBrainDumpAiProvider.Instance, metricsProvider);

        var profile = engine.BuildCognitiveProfile("user-1");

        Assert.NotNull(profile);
        Assert.Equal(string.Empty, profile.UserId);
        Assert.Contains("Ainda não há dados suficientes", profile.Summary);
        Assert.Empty(profile.EnergyPatterns);
        Assert.Empty(profile.MoodPatterns);
        Assert.Empty(profile.Recommendations);
    }

    [Fact]
    public void BuildPersonalizationMetrics_ComputesExpectedValues()
    {
        var repository = new InMemoryBehaviorRepository();
        var metricsProvider = new PersonalizationMetricsProvider();
        var engine = new PersonalizationEngine(repository, NullBrainDumpAiProvider.Instance, metricsProvider);

        repository.SaveEvent(new UserActivityEvent
        {
            Id = 1,
            UserId = "user-1",
            EventType = "task",
            Timestamp = DateTime.UtcNow.AddHours(-4),
            Category = "Trabalho",
            EstimatedMinutes = 45,
            EnergyLevel = 8,
            Mood = "Focado",
            Completed = true
        });

        repository.SaveEvent(new UserActivityEvent
        {
            Id = 2,
            UserId = "user-1",
            EventType = "task",
            Timestamp = DateTime.UtcNow.AddHours(-2),
            Category = "Estudo",
            EstimatedMinutes = 120,
            EnergyLevel = 5,
            Mood = "Calmo",
            Completed = false
        });

        var metrics = engine.BuildPersonalizationMetrics("user-1");

        Assert.Equal(2, metrics.TotalEvents);
        Assert.Equal(1, metrics.CompletedEvents);
        Assert.Equal(1, metrics.AbandonedEvents);
        Assert.Equal(0.5, metrics.ProcrastinationRate);
        Assert.Equal(45.0, metrics.AverageCompletionMinutes);
        Assert.Equal("Trabalho", metrics.MostFrequentCategory);
        Assert.Equal(0, metrics.ShortTaskCompleted);
        Assert.Equal(1, metrics.LongTaskAbandoned);
    }

    [Fact]
    public void GenerateRecommendations_ProvidesSupportiveAdvice_WhenManyShortTasksComplete()
    {
        var repository = new InMemoryBehaviorRepository();
        var metricsProvider = new PersonalizationMetricsProvider();
        var engine = new PersonalizationEngine(repository, NullBrainDumpAiProvider.Instance, metricsProvider);

        for (var i = 0; i < 4; i++)
        {
            repository.SaveEvent(new UserActivityEvent
            {
                Id = i + 1,
                UserId = "user-2",
                EventType = "task",
                Timestamp = DateTime.UtcNow.AddHours(-i),
                Category = "Rotina",
                EstimatedMinutes = 10,
                EnergyLevel = 6,
                Mood = "Bem",
                Completed = true
            });
        }

        var recommendations = engine.GenerateRecommendations("user-2");

        Assert.NotEmpty(recommendations);
        Assert.Contains(recommendations, recommendation => recommendation.Title.Contains("vitórias rápidas") || recommendation.Title.Contains("microtarefas") || recommendation.Category == "Motivação");
    }
}

internal sealed class NullBrainDumpAiProvider : IBrainDumpAiProvider
{
    public static readonly NullBrainDumpAiProvider Instance = new();

    public string AnalyzeBrainDump(string brainDumpText) => string.Empty;
}
