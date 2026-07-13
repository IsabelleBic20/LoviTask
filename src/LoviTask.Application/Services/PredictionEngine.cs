using LoviTask.Application.Interfaces;
using LoviTask.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace LoviTask.Application.Services;

public class PredictionEngine : IPredictionEngine
{
    private readonly ITaskRepository _taskRepository;
    private readonly ICognitiveProfileService _cognitiveProfileService;
    private readonly ICognitiveLoadService _cognitiveLoadService;
    private readonly IExplainabilityEngine _explainabilityEngine;

    public PredictionEngine(
        ITaskRepository taskRepository,
        ICognitiveProfileService cognitiveProfileService,
        ICognitiveLoadService cognitiveLoadService,
        IExplainabilityEngine explainabilityEngine)
    {
        _taskRepository = taskRepository;
        _cognitiveProfileService = cognitiveProfileService;
        _cognitiveLoadService = cognitiveLoadService;
        _explainabilityEngine = explainabilityEngine;
    }

    public List<PredictionResult> GetPredictions(string userId)
    {
        var tasks = _taskRepository.GetByUserId(userId)
            .Where(t => t.Status == "Pending" || t.Status == "Delayed" || t.Status == "InProgress")
            .ToList();

        var results = new List<PredictionResult>();
        foreach (var task in tasks)
        {
            results.Add(CalculatePrediction(task, userId));
        }

        return results;
    }

    public PredictionResult CalculatePrediction(UserTask task, string userId)
    {
        var profile = _cognitiveProfileService.GetProfile(userId);
        var load = _cognitiveLoadService.GetCognitiveLoad(userId);
        double energy = load.UserEnergyLevel ?? 5.0;

        // Base de risco: O índice geral de procrastinação do usuário
        double risk = profile.ProcrastinationIndex;

        // 1. Energia Exigida vs Energia do Usuário
        if (task.EnergyRequirement == "Alta" && energy <= 3)
        {
            risk += 35;
        }
        else if (task.EnergyRequirement == "Média" && energy <= 3)
        {
            risk += 15;
        }

        // 2. Horário da Tarefa vs Janela de Fadiga do Perfil
        if (task.SuggestedTime.HasValue && !string.IsNullOrEmpty(profile.WorstProductivityHour))
        {
            var taskHour = task.SuggestedTime.Value.Hour;
            var parts = profile.WorstProductivityHour.Split(':');
            if (parts.Length > 0 && int.TryParse(parts[0], out int worstHour))
            {
                if (taskHour == worstHour || taskHour == (worstHour + 1) % 24)
                {
                    risk += 25;
                }
            }
        }

        // 3. Duração Estimada Longa
        if (task.EstimatedMinutes > 60)
        {
            risk += 15;
        }

        // 4. Prioridade Baixa
        if (task.Priority == "Low")
        {
            risk += 10;
        }

        risk = Math.Clamp(risk, 5, 99);

        // Obter justificativa estruturada do ExplainabilityEngine
        int hour = task.SuggestedTime?.Hour ?? DateTime.UtcNow.Hour;
        string explanation = _explainabilityEngine.ExplainProcrastinationRisk(risk, task.Category, hour, energy, profile);

        return new PredictionResult
        {
            TaskId = task.Id,
            TaskTitle = task.Title,
            RiskPercentage = Math.Round(risk, 0),
            Explanation = explanation
        };
    }
}
