using LoviTask.Application.Interfaces;
using LoviTask.Domain.Models;
using System;
using System.Linq;

namespace LoviTask.Application.Services;

public class CognitiveLoadService : ICognitiveLoadService
{
    private readonly IBehaviorRepository _behaviorRepository;

    public CognitiveLoadService(IBehaviorRepository behaviorRepository)
    {
        _behaviorRepository = behaviorRepository;
    }

    public CognitiveLoadResult GetCognitiveLoad(string userId)
    {
        var events = _behaviorRepository.GetEvents(userId).ToList();

        // 1. Obter tarefas ativas (criadas mas não completadas)
        var created = events.Where(e => e.EventType == "TaskCreated" || e.EventType == "task").ToList();
        var completed = events.Where(e => e.EventType == "TaskCompleted" || (e.EventType == "task" && e.Completed == true)).ToList();
        
        int activeCount = 0;
        foreach (var task in created)
        {
            bool isCompleted = completed.Any(c => c.Description == task.Description);
            if (!isCompleted && task.Completed != true)
            {
                activeCount++;
            }
        }

        // 2. Tarefas atrasadas nos últimos 3 dias
        var delayedRecent = events.Count(e => e.EventType == "TaskDelayed" && e.Timestamp >= DateTime.UtcNow.AddDays(-3));

        // 3. Interrupções no dia de hoje (TaskPaused)
        var interruptionsToday = events.Count(e => e.EventType == "TaskPaused" && e.Timestamp.Date == DateTime.UtcNow.Date);

        // 4. Nível de energia recente (últimos 24h)
        var lastEnergyEvent = events
            .Where(e => (e.EnergyLevel.HasValue && e.EnergyLevel.Value > 0) || e.EventType == "EnergyRegistered")
            .OrderByDescending(e => e.Timestamp)
            .FirstOrDefault();

        double? energyLevel = lastEnergyEvent?.EnergyLevel;

        // 5. Cálculo heurístico da pontuação de sobrecarga
        double score = (activeCount * 8) + (delayedRecent * 15) + (interruptionsToday * 6);

        if (energyLevel.HasValue)
        {
            if (energyLevel.Value <= 3)
            {
                score += 20; // Fadiga alta aumenta a sobrecarga percebida
            }
            else if (energyLevel.Value >= 8)
            {
                score -= 15; // Energia alta reduz o impacto da carga de trabalho
            }
        }

        score = Math.Clamp(score, 0, 100);

        // 6. Classificação e Conselhos de UX
        string classification;
        string mitigationAdvice;

        if (score <= 20)
        {
            classification = "Muito baixa";
            mitigationAdvice = "Sua mente está livre e descansada. Aproveite para planejar a semana ou adiantar tarefas importantes!";
        }
        else if (score <= 40)
        {
            classification = "Baixa";
            mitigationAdvice = "Nível de carga confortável. Ideal para progredir em estudos ou tarefas analíticas com tranquilidade.";
        }
        else if (score <= 60)
        {
            classification = "Moderada";
            mitigationAdvice = "Carga de trabalho sob controle. Planeje pausas curtas de 5 minutos a cada sessão de foco de 30 minutos.";
        }
        else if (score <= 80)
        {
            classification = "Alta";
            mitigationAdvice = "Fadiga mental se acumulando. Evite alternar entre tarefas (multitarefa) e adie reuniões não urgentes.";
        }
        else
        {
            classification = "Crítica";
            mitigationAdvice = "Sobrecarga crítica. Sugerimos o Modo Crise: descanse ou foque em concluir no máximo duas microtarefas hoje.";
        }

        return new CognitiveLoadResult
        {
            Score = Math.Round(score, 0),
            Classification = classification,
            MitigationAdvice = mitigationAdvice,
            ActiveTasksCount = activeCount,
            DelayedTasksCount = delayedRecent,
            RecentInterruptionCount = interruptionsToday,
            UserEnergyLevel = energyLevel
        };
    }
}
