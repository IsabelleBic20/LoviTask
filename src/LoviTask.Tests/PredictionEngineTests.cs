using LoviTask.Application.Interfaces;
using LoviTask.Application.Services;
using LoviTask.Domain.Events;
using LoviTask.Domain.Models;
using LoviTask.Infrastructure.Repositories;
using System;
using System.Linq;
using Xunit;

namespace LoviTask.Tests;

public class PredictionEngineTests
{
    private readonly InMemoryBehaviorRepository _behaviorRepository;
    private readonly InMemoryCognitiveProfileRepository _profileRepository;
    private readonly InMemoryTaskRepository _taskRepository;
    private readonly CognitiveLoadService _loadService;
    private readonly CognitiveProfileService _profileService;
    private readonly ExplainabilityEngine _explainabilityEngine;
    private readonly PredictionEngine _predictionEngine;

    public PredictionEngineTests()
    {
        _behaviorRepository = new InMemoryBehaviorRepository();
        _profileRepository = new InMemoryCognitiveProfileRepository();
        _taskRepository = new InMemoryTaskRepository();
        _loadService = new CognitiveLoadService(_behaviorRepository);
        _profileService = new CognitiveProfileService(_behaviorRepository, _profileRepository, _loadService);
        _explainabilityEngine = new ExplainabilityEngine();
        _predictionEngine = new PredictionEngine(_taskRepository, _profileService, _loadService, _explainabilityEngine);
    }

    [Fact]
    public void CalculatePrediction_ReturnsBaseRrisk_WhenNoOutliers()
    {
        // Arrange
        var userId = "user-1";
        _profileRepository.SaveProfile(new CognitiveProfile
        {
            UserId = userId,
            ProcrastinationIndex = 20,
            WorstProductivityHour = "23:00"
        });

        var task = new UserTask
        {
            Title = "Task A",
            Category = "Trabalho",
            EnergyRequirement = "Média",
            EstimatedMinutes = 30,
            SuggestedTime = DateTime.UtcNow.Date.AddHours(14) // 14:00 (neutro)
        };

        // Act
        var result = _predictionEngine.CalculatePrediction(task, userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(20, result.RiskPercentage);
        Assert.Contains("neutras", result.Explanation);
    }

    [Fact]
    public void CalculatePrediction_SpikesRisk_WhenUserEnergyIsLowAndTaskDemandsHighEnergy()
    {
        // Arrange
        var userId = "user-2";
        _profileRepository.SaveProfile(new CognitiveProfile
        {
            UserId = userId,
            ProcrastinationIndex = 30,
            WorstProductivityHour = "23:00"
        });

        // Registrar energia muito baixa (2)
        _behaviorRepository.SaveEvent(new UserActivityEvent
        {
            UserId = userId,
            EventType = "EnergyRegistered",
            Timestamp = DateTime.UtcNow,
            EnergyLevel = 2.0
        });

        var task = new UserTask
        {
            Title = "Complex Coding Session",
            Category = "Trabalho",
            EnergyRequirement = "Alta",
            EstimatedMinutes = 30,
            SuggestedTime = DateTime.UtcNow.Date.AddHours(14)
        };

        // Act
        var result = _predictionEngine.CalculatePrediction(task, userId);

        // Assert
        // Base 30 + 35 = 65% de risco
        Assert.Equal(65, result.RiskPercentage);
        Assert.Contains("energia atual está baixa", result.Explanation);
    }
}
