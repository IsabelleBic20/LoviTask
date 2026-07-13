using LoviTask.Application.Interfaces;
using LoviTask.Application.Services;
using LoviTask.Domain.Events;
using LoviTask.Domain.Models;
using LoviTask.Infrastructure.Repositories;
using System;
using System.Linq;
using Xunit;

namespace LoviTask.Tests;

public class CognitiveLoadAndRecommendationsTests
{
    private readonly InMemoryBehaviorRepository _behaviorRepository;
    private readonly InMemoryCognitiveProfileRepository _profileRepository;
    private readonly CognitiveLoadService _loadService;
    private readonly ExplainabilityEngine _explainabilityEngine;
    private readonly CognitiveProfileService _profileService;
    private readonly RecommendationEngine _recommendationEngine;

    public CognitiveLoadAndRecommendationsTests()
    {
        _behaviorRepository = new InMemoryBehaviorRepository();
        _profileRepository = new InMemoryCognitiveProfileRepository();
        _loadService = new CognitiveLoadService(_behaviorRepository);
        _explainabilityEngine = new ExplainabilityEngine();
        _profileService = new CognitiveProfileService(_behaviorRepository, _profileRepository, _loadService);
        _recommendationEngine = new RecommendationEngine(_profileService, _loadService, _explainabilityEngine);
    }

    [Fact]
    public void GetCognitiveLoad_ReturnsZero_WhenNoEvents()
    {
        // Act
        var result = _loadService.GetCognitiveLoad("user-1");

        // Assert
        Assert.NotNull(result);
        Assert.Equal(0, result.Score);
        Assert.Equal("Muito baixa", result.Classification);
        Assert.Contains("mente está livre", result.MitigationAdvice);
    }

    [Fact]
    public void GetCognitiveLoad_PilesUpScores_ForPendingAndDelayedTasks()
    {
        // Arrange
        var userId = "user-1";
        
        // 3 tarefas pendentes (+24 pontos)
        for (int i = 1; i <= 3; i++)
        {
            _behaviorRepository.SaveEvent(new UserActivityEvent
            {
                Id = i,
                UserId = userId,
                EventType = "TaskCreated",
                Timestamp = DateTime.UtcNow.AddHours(-i),
                Description = $"Pending Task {i}"
            });
        }

        // 2 tarefas adiadas (+30 pontos)
        _behaviorRepository.SaveEvent(new UserActivityEvent
        {
            Id = 4,
            UserId = userId,
            EventType = "TaskDelayed",
            Timestamp = DateTime.UtcNow.AddHours(-1),
            Description = "Pending Task 1"
        });

        _behaviorRepository.SaveEvent(new UserActivityEvent
        {
            Id = 5,
            UserId = userId,
            EventType = "TaskDelayed",
            Timestamp = DateTime.UtcNow.AddHours(-2),
            Description = "Pending Task 2"
        });

        // Act
        var result = _loadService.GetCognitiveLoad(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(54, result.Score); // 24 + 30
        Assert.Equal("Moderada", result.Classification);
    }

    [Fact]
    public void GetRecommendations_TriggersCrisisMode_WhenCognitiveLoadIsCritical()
    {
        // Arrange
        var userId = "user-1";
        
        // Registrar muitas tarefas pendentes para forçar sobrecarga crítica (>80)
        for (int i = 1; i <= 11; i++) // 11 * 8 = 88 pontos
        {
            _behaviorRepository.SaveEvent(new UserActivityEvent
            {
                Id = i,
                UserId = userId,
                EventType = "TaskCreated",
                Timestamp = DateTime.UtcNow.AddHours(-i),
                Description = $"Critical Task {i}"
            });
        }

        // Act
        var recommendations = _recommendationEngine.GetRecommendations(userId);

        // Assert
        Assert.NotEmpty(recommendations);
        Assert.Contains(recommendations, r => r.Title.Contains("Modo Crise") && r.Category == "Energia");
    }

    [Fact]
    public void GetRecommendations_SuggestsLowEnergyTasks_WhenEnergyIsLow()
    {
        // Arrange
        var userId = "user-2";

        // Registrar energia muito baixa
        _behaviorRepository.SaveEvent(new UserActivityEvent
        {
            Id = 1,
            UserId = userId,
            EventType = "EnergyRegistered",
            Timestamp = DateTime.UtcNow,
            EnergyLevel = 2.0
        });

        // Act
        var recommendations = _recommendationEngine.GetRecommendations(userId);

        // Assert
        Assert.NotEmpty(recommendations);
        Assert.Contains(recommendations, r => r.Title.Contains("Baixa Energia") && r.Category == "Energia");
    }
}
