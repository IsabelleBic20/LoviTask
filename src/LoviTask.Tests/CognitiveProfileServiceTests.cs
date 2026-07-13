using LoviTask.Application.Interfaces;
using LoviTask.Application.Services;
using LoviTask.Domain.Events;
using LoviTask.Domain.Models;
using LoviTask.Infrastructure.Repositories;
using System;
using System.Collections.Generic;
using Xunit;

namespace LoviTask.Tests;

public class CognitiveProfileServiceTests
{
    private readonly InMemoryBehaviorRepository _behaviorRepository;
    private readonly InMemoryCognitiveProfileRepository _profileRepository;
    private readonly CognitiveProfileService _service;

    public CognitiveProfileServiceTests()
    {
        _behaviorRepository = new InMemoryBehaviorRepository();
        _profileRepository = new InMemoryCognitiveProfileRepository();
        var loadService = new CognitiveLoadService(_behaviorRepository);
        _service = new CognitiveProfileService(_behaviorRepository, _profileRepository, loadService);
    }

    [Fact]
    public void GetProfile_ReturnsNewProfile_WhenNoneExists()
    {
        // Act
        var profile = _service.GetProfile("user-test");

        // Assert
        Assert.NotNull(profile);
        Assert.Equal("user-test", profile.UserId);
        Assert.Equal("Ainda sem dados", profile.BestProductivityHour);
        Assert.Equal("Ainda não há dados suficientes para traçar seu perfil cognitivo. Comece a criar e concluir tarefas!", profile.Summary);
    }

    [Fact]
    public void RecalculateProfile_CalculatesMetricsCorrectly_WhenEventsExist()
    {
        // Arrange
        var userId = "user-1";

        // Criação de tarefas
        _behaviorRepository.SaveEvent(new UserActivityEvent
        {
            Id = 1,
            UserId = userId,
            EventType = "TaskCreated",
            Timestamp = DateTime.UtcNow.AddDays(-2),
            Description = "Task 1",
            EstimatedMinutes = 30
        });

        _behaviorRepository.SaveEvent(new UserActivityEvent
        {
            Id = 2,
            UserId = userId,
            EventType = "TaskCreated",
            Timestamp = DateTime.UtcNow.AddDays(-2),
            Description = "Task 2",
            EstimatedMinutes = 45
        });

        // Tarefa 1 iniciada às 10:00 e concluída às 10:40 (Duração de 40 min)
        var baseDate = DateTime.UtcNow.Date.AddDays(-1);
        var startTime1 = new DateTime(baseDate.Year, baseDate.Month, baseDate.Day, 10, 0, 0);
        var endTime1 = new DateTime(baseDate.Year, baseDate.Month, baseDate.Day, 10, 40, 0);

        _behaviorRepository.SaveEvent(new UserActivityEvent
        {
            Id = 3,
            UserId = userId,
            EventType = "TaskStarted",
            Timestamp = startTime1,
            Description = "Task 1"
        });

        _behaviorRepository.SaveEvent(new UserActivityEvent
        {
            Id = 4,
            UserId = userId,
            EventType = "TaskCompleted",
            Timestamp = endTime1,
            Description = "Task 1"
        });

        // Tarefa 2 adiada
        _behaviorRepository.SaveEvent(new UserActivityEvent
        {
            Id = 5,
            UserId = userId,
            EventType = "TaskDelayed",
            Timestamp = DateTime.UtcNow.AddHours(-3),
            Description = "Task 2"
        });

        // Act
        var profile = _service.RecalculateProfile(userId);

        // Assert
        Assert.NotNull(profile);
        Assert.Equal(userId, profile.UserId);
        Assert.Equal("10:00", profile.BestProductivityHour); // Conclusão ocorreu às 10h
        Assert.Equal(0.5, profile.CompletionRate); // 1 de 2 concluída
        Assert.Equal(0.5, profile.DelayRate);      // 1 de 2 adiada
        Assert.Equal(40.0, profile.AverageTaskDuration); // Durou 40 mins
        Assert.True(profile.ProcrastinationIndex > 0);
        Assert.True(profile.CognitiveLoad > 0);
    }

    [Fact]
    public void GetCognitiveHistory_AggregatesEventsCorrectly_ForLast7Days()
    {
        // Arrange
        var userId = "user-history-test";
        
        _behaviorRepository.SaveEvent(new UserActivityEvent
        {
            UserId = userId,
            EventType = "EnergyRegistered",
            Timestamp = DateTime.UtcNow,
            EnergyLevel = 8.0
        });

        _behaviorRepository.SaveEvent(new UserActivityEvent
        {
            UserId = userId,
            EventType = "TaskCompleted",
            Timestamp = DateTime.UtcNow,
            Description = "Task Done Today"
        });

        // Act
        var history = _service.GetCognitiveHistory(userId, 7);

        // Assert
        Assert.NotNull(history);
        Assert.Equal(7, history.Count);
        
        var todayHistory = history.Last();
        Assert.Equal(8.0, todayHistory.AverageEnergy);
        Assert.Equal(1, todayHistory.TasksCompleted);
        Assert.Equal(0, todayHistory.TasksDelayed);
    }
}

internal class InMemoryCognitiveProfileRepository : ICognitiveProfileRepository
{
    private readonly Dictionary<string, CognitiveProfile> _profiles = new();

    public CognitiveProfile? GetProfile(string userId)
    {
        return _profiles.TryGetValue(userId, out var profile) ? profile : null;
    }

    public void SaveProfile(CognitiveProfile profile)
    {
        _profiles[profile.UserId] = profile;
    }
}
