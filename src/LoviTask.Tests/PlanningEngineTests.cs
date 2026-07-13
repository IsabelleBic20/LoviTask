using LoviTask.Application.Interfaces;
using LoviTask.Application.Services;
using LoviTask.Domain.Events;
using LoviTask.Domain.Models;
using LoviTask.Infrastructure.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using Xunit;

namespace LoviTask.Tests;

public class PlanningEngineTests
{
    private readonly InMemoryBehaviorRepository _behaviorRepository;
    private readonly InMemoryCognitiveProfileRepository _profileRepository;
    private readonly InMemoryTaskRepository _taskRepository;
    private readonly CognitiveLoadService _loadService;
    private readonly CognitiveProfileService _profileService;
    private readonly PlanningEngine _planningEngine;

    public PlanningEngineTests()
    {
        _behaviorRepository = new InMemoryBehaviorRepository();
        _profileRepository = new InMemoryCognitiveProfileRepository();
        _taskRepository = new InMemoryTaskRepository();
        _loadService = new CognitiveLoadService(_behaviorRepository);
        _profileService = new CognitiveProfileService(_behaviorRepository, _profileRepository, _loadService);
        _planningEngine = new PlanningEngine(_taskRepository, _profileService, _behaviorRepository);
    }

    [Fact]
    public void CalculateSmartTime_AppliesCorrection_WhenUserHasHighDelayRate()
    {
        // Arrange
        var userId = "user-1";
        
        // Simular perfil com alta taxa de atraso (0.6)
        _profileRepository.SaveProfile(new CognitiveProfile
        {
            UserId = userId,
            DelayRate = 0.6,
            BestProductivityHour = "09:00"
        });

        var task = new UserTask
        {
            Title = "Task Complex",
            EstimatedMinutes = 30,
            Category = "Trabalho"
        };

        // Act
        var planned = _planningEngine.PlanAndSplitTask(task, userId);

        // Assert
        // 30 * 1.6 = 48 -> Arredondado para 50
        Assert.Equal(50, planned.First().EstimatedMinutes);
        Assert.Equal("Difícil", planned.First().ComplexityEstimate);
    }

    [Fact]
    public void SplitAndPlanTask_SplitsTask_WhenDurationExceeds60Minutes()
    {
        // Arrange
        var userId = "user-2";
        _profileRepository.SaveProfile(new CognitiveProfile
        {
            UserId = userId,
            DelayRate = 0.0, // Sem atraso
            BestProductivityHour = "09:00"
        });

        // Tarefa de 120 minutos (2 horas)
        var task = new UserTask
        {
            Title = "Escrever Artigo Científico",
            EstimatedMinutes = 120,
            Category = "Estudo"
        };

        // Act
        var planned = _planningEngine.PlanAndSplitTask(task, userId);

        // Assert
        // Deve retornar a principal + 4 sub-tarefas (120 / 30 = 4)
        Assert.Equal(5, planned.Count);
        Assert.Equal(task.Id, planned[0].Id);
        
        // Sub-tarefa 1 deve ter ParentTaskId igual ao ID da principal
        var firstSubtask = planned[1];
        Assert.Equal(task.Id, firstSubtask.ParentTaskId);
        
        // Sub-tarefa 2 deve ter PredecessorTaskId igual ao ID da sub-tarefa 1
        var secondSubtask = planned[2];
        Assert.Equal(firstSubtask.Id, secondSubtask.PredecessorTaskId);
    }

    [Fact]
    public void RebuildSchedule_ShiftsSubsequentTasks_WhenPredecessorIsDelayed()
    {
        // Arrange
        var userId = "user-3";
        _profileRepository.SaveProfile(new CognitiveProfile
        {
            UserId = userId,
            BestProductivityHour = "09:00"
        });

        var now = DateTime.UtcNow;

        var task1 = new UserTask
        {
            Id = 1,
            UserId = userId,
            Title = "Task A",
            Status = "Pending",
            SuggestedTime = now.AddMinutes(-30), // Agendada no passado
            DueDate = now.AddMinutes(0),
            EstimatedMinutes = 30
        };

        var task2 = new UserTask
        {
            Id = 2,
            UserId = userId,
            Title = "Task B",
            Status = "Pending",
            SuggestedTime = now.AddMinutes(5), // Conflita se Task A for empurrada para frente
            DueDate = now.AddMinutes(35),
            EstimatedMinutes = 30
        };

        _taskRepository.Save(task1);
        _taskRepository.Save(task2);

        // Act
        _planningEngine.RebuildSchedule(userId);

        // Assert
        var updatedTask1 = _taskRepository.GetById(1);
        var updatedTask2 = _taskRepository.GetById(2);

        Assert.NotNull(updatedTask1);
        Assert.NotNull(updatedTask2);
        
        // Task A deve ter sido empurrada para frente (agendada para no mínimo DateTime.UtcNow.AddMinutes(10))
        Assert.True(updatedTask1.SuggestedTime >= now.AddMinutes(9));
        
        // Task B deve ter sido empurrada para iniciar após o término de Task A + 10 min de descanso
        Assert.True(updatedTask2.SuggestedTime >= updatedTask1.DueDate.Value.AddMinutes(9));
    }
}

internal class InMemoryTaskRepository : ITaskRepository
{
    private readonly Dictionary<int, UserTask> _tasks = new();
    private int _nextId = 1;

    public UserTask? GetById(int id)
    {
        return _tasks.TryGetValue(id, out var task) ? task : null;
    }

    public IReadOnlyList<UserTask> GetByUserId(string userId)
    {
        return _tasks.Values.Where(t => t.UserId == userId).ToList();
    }

    public void Save(UserTask task)
    {
        if (task.Id <= 0)
        {
            task.Id = _nextId++;
        }
        _tasks[task.Id] = task;
    }

    public void Delete(int id)
    {
        _tasks.Remove(id);
    }
}
