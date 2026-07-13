using LoviTask.Application.Interfaces;
using LoviTask.Domain.Events;
using LoviTask.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace LoviTask.Application.Services;

public class PlanningEngine : IPlanningEngine
{
    private readonly ITaskRepository _taskRepository;
    private readonly ICognitiveProfileService _cognitiveProfileService;
    private readonly IBehaviorRepository _behaviorRepository;

    public PlanningEngine(
        ITaskRepository taskRepository,
        ICognitiveProfileService cognitiveProfileService,
        IBehaviorRepository behaviorRepository)
    {
        _taskRepository = taskRepository;
        _cognitiveProfileService = cognitiveProfileService;
        _behaviorRepository = behaviorRepository;
    }

    public List<UserTask> PlanAndSplitTask(UserTask task, string userId)
    {
        var profile = _cognitiveProfileService.GetProfile(userId);
        
        // 1. Correção Inteligente de Tempo (Estimativa Adaptativa)
        int suggestedMinutes = CalculateSmartTime(task.EstimatedMinutes, profile);
        task.EstimatedMinutes = suggestedMinutes;

        // 2. Estimar Complexidade
        task.ComplexityEstimate = EstimateComplexity(suggestedMinutes);
        task.UserId = userId;
        task.CreatedAt = DateTime.UtcNow;
        task.Status = "Pending";

        // Sugerir horário inicial com base no melhor horário produtivo do usuário
        DateTime initialSuggestedTime = GetInitialSuggestedTime(profile);
        initialSuggestedTime = AvoidScheduleConflicts(userId, initialSuggestedTime, suggestedMinutes, null);
        task.SuggestedTime = initialSuggestedTime;
        task.DueDate = initialSuggestedTime.AddMinutes(suggestedMinutes);

        // Salvar a tarefa principal primeiro para gerar o ID
        _taskRepository.Save(task);

        // Registrar evento de criação no Event Store
        _behaviorRepository.SaveEvent(new UserActivityEvent
        {
            UserId = userId,
            EventType = "TaskCreated",
            Timestamp = DateTime.UtcNow,
            Description = task.Title,
            Category = task.Category,
            EstimatedMinutes = suggestedMinutes
        });

        var plannedTasks = new List<UserTask> { task };

        // 3. Quebra Automática de Tarefas Grandes (> 60 min)
        if (suggestedMinutes > 60)
        {
            int subtaskCount = (int)Math.Ceiling(suggestedMinutes / 30.0);
            int subtaskDuration = (int)Math.Round((double)suggestedMinutes / subtaskCount / 10.0) * 10;
            if (subtaskDuration < 15) subtaskDuration = 15;

            var steps = new[]
            {
                "Pesquisar referências e coletar dados",
                "Estruturar o esboço e planejar seções",
                "Desenvolver e redigir conteúdo principal",
                "Revisar ortografia e fazer ajustes finais"
            };

            int? previousSubtaskId = null;
            DateTime currentSubtaskTime = initialSuggestedTime;

            for (int i = 0; i < subtaskCount; i++)
            {
                string stepTitle = i < steps.Length ? steps[i] : $"Avançar desenvolvimento (Parte {i + 1})";
                
                var subtask = new UserTask
                {
                    UserId = userId,
                    Title = $"{stepTitle}: {task.Title}",
                    Description = $"Microtarefa {i + 1} de {subtaskCount} da tarefa principal: {task.Title}",
                    Category = task.Category,
                    EnergyRequirement = task.EnergyRequirement,
                    EstimatedMinutes = subtaskDuration,
                    CreatedAt = DateTime.UtcNow,
                    Status = "Pending",
                    Priority = task.Priority,
                    ParentTaskId = task.Id,
                    ComplexityEstimate = "Fácil",
                    PredecessorTaskId = previousSubtaskId
                };

                // Agendar sequencialmente com 10 minutos de pausa entre sub-tarefas
                currentSubtaskTime = AvoidScheduleConflicts(userId, currentSubtaskTime, subtaskDuration, null);
                subtask.SuggestedTime = currentSubtaskTime;
                subtask.DueDate = currentSubtaskTime.AddMinutes(subtaskDuration);

                _taskRepository.Save(subtask);
                plannedTasks.Add(subtask);

                // O próximo depende deste ID gerado
                previousSubtaskId = subtask.Id;

                // Incrementar tempo para a próxima sub-tarefa (duração + 10 min de pausa cognitiva)
                currentSubtaskTime = currentSubtaskTime.AddMinutes(subtaskDuration + 10);
            }

            // Atualizar tarefa principal para refletir que ela foi dividida
            task.Status = "Pending"; // Mantém pending
            _taskRepository.Save(task);
        }

        return plannedTasks;
    }

    public void RebuildSchedule(string userId)
    {
        var profile = _cognitiveProfileService.GetProfile(userId);
        var pendingTasks = _taskRepository.GetByUserId(userId)
            .Where(t => t.Status == "Pending" && t.SuggestedTime.HasValue)
            .OrderBy(t => t.SuggestedTime)
            .ToList();

        if (!pendingTasks.Any()) return;

        // Se a primeira tarefa estiver no passado, empurramos para "Agora" + 10 minutos de margem
        DateTime nextAvailableTime = DateTime.UtcNow.AddMinutes(10);

        foreach (var task in pendingTasks)
        {
            if (task.SuggestedTime < nextAvailableTime)
            {
                // Empurra o início para o primeiro slot livre
                nextAvailableTime = AvoidScheduleConflicts(userId, nextAvailableTime, task.EstimatedMinutes, task.Id);
                task.SuggestedTime = nextAvailableTime;
                task.DueDate = nextAvailableTime.AddMinutes(task.EstimatedMinutes);
                task.Status = "Delayed"; // Atualizar status para Delayed
                _taskRepository.Save(task);

                // Próxima tarefa pode iniciar após o término da atual + 10 min
                nextAvailableTime = nextAvailableTime.AddMinutes(task.EstimatedMinutes + 10);
            }
            else
            {
                // Garante que dependências do predecessor também não conflitem
                if (task.PredecessorTaskId.HasValue)
                {
                    var predecessor = _taskRepository.GetById(task.PredecessorTaskId.Value);
                    if (predecessor != null && predecessor.SuggestedTime.HasValue && task.SuggestedTime < predecessor.DueDate)
                    {
                        var startAfterPredecessor = predecessor.DueDate.Value.AddMinutes(10);
                        startAfterPredecessor = AvoidScheduleConflicts(userId, startAfterPredecessor, task.EstimatedMinutes, task.Id);
                        task.SuggestedTime = startAfterPredecessor;
                        task.DueDate = startAfterPredecessor.AddMinutes(task.EstimatedMinutes);
                        _taskRepository.Save(task);
                    }
                }
                
                nextAvailableTime = task.DueDate.Value.AddMinutes(10);
            }
        }
    }

    private int CalculateSmartTime(int userMinutes, CognitiveProfile profile)
    {
        // Se a taxa de adiamento for alta (>= 0.3), aplicamos o fator de correção
        double multiplier = 1.0;
        if (profile.DelayRate >= 0.5) multiplier = 1.6;
        else if (profile.DelayRate >= 0.3) multiplier = 1.3;

        double calculated = userMinutes * multiplier;

        // Arredondar para a dezena de minutos mais próxima
        int rounded = (int)Math.Round(calculated / 10.0) * 10;
        return rounded > 0 ? rounded : 10;
    }

    private string EstimateComplexity(int minutes)
    {
        if (minutes <= 15) return "Fácil";
        if (minutes <= 45) return "Média";
        return "Difícil";
    }

    private DateTime GetInitialSuggestedTime(CognitiveProfile profile)
    {
        var now = DateTime.UtcNow;
        int targetHour = 9; // Horário padrão de início

        if (!string.IsNullOrEmpty(profile.BestProductivityHour) && profile.BestProductivityHour != "Ainda sem dados")
        {
            var parts = profile.BestProductivityHour.Split(':');
            if (parts.Length > 0 && int.TryParse(parts[0], out int h))
            {
                targetHour = h;
            }
        }

        // Sugere para hoje se ainda não passou do horário, senão amanhã
        var suggested = new DateTime(now.Year, now.Month, now.Day, targetHour, 0, 0, DateTimeKind.Utc);
        if (suggested < now)
        {
            suggested = suggested.AddDays(1);
        }

        return suggested;
    }

    private DateTime AvoidScheduleConflicts(string userId, DateTime requestedStart, int durationMinutes, int? ignoreTaskId)
    {
        var existing = _taskRepository.GetByUserId(userId)
            .Where(t => t.SuggestedTime.HasValue && t.DueDate.HasValue && t.Status != "Completed" && t.Id != ignoreTaskId)
            .ToList();

        DateTime currentStart = requestedStart;
        DateTime currentEnd = requestedStart.AddMinutes(durationMinutes);
        bool hasConflict = true;

        while (hasConflict)
        {
            hasConflict = false;
            foreach (var task in existing)
            {
                // Verifica interseção de horários
                if (currentStart < task.DueDate && currentEnd > task.SuggestedTime)
                {
                    // Conflito! Move o início para o final da tarefa conflitante + 10 min de descanso
                    currentStart = task.DueDate.Value.AddMinutes(10);
                    currentEnd = currentStart.AddMinutes(durationMinutes);
                    hasConflict = true;
                    break;
                }
            }
        }

        return currentStart;
    }
}
