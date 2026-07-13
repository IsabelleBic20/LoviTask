using LoviTask.Application.Interfaces;
using LoviTask.Domain.Events;
using LoviTask.Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;

namespace LoviTask.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CognitiveController : ControllerBase
{
    private readonly ICognitiveProfileService _cognitiveProfileService;
    private readonly ICognitiveLoadService _cognitiveLoadService;
    private readonly IRecommendationEngine _recommendationEngine;
    private readonly IBehaviorRepository _behaviorRepository;
    private readonly ITaskRepository _taskRepository;
    private readonly IPlanningEngine _planningEngine;
    private readonly IPredictionEngine _predictionEngine;

    public CognitiveController(
        ICognitiveProfileService cognitiveProfileService,
        ICognitiveLoadService cognitiveLoadService,
        IRecommendationEngine recommendationEngine,
        IBehaviorRepository behaviorRepository,
        ITaskRepository taskRepository,
        IPlanningEngine planningEngine,
        IPredictionEngine predictionEngine)
    {
        _cognitiveProfileService = cognitiveProfileService;
        _cognitiveLoadService = cognitiveLoadService;
        _recommendationEngine = recommendationEngine;
        _behaviorRepository = behaviorRepository;
        _taskRepository = taskRepository;
        _planningEngine = planningEngine;
        _predictionEngine = predictionEngine;
    }

    private string GetUserId()
    {
        return User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value 
               ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value 
               ?? User.Identity?.Name 
               ?? "default-user";
    }

    /// <summary>
    /// Retorna o Perfil Cognitivo persistido do usuário autenticado.
    /// </summary>
    [HttpGet("profile")]
    public IActionResult GetProfile()
    {
        var profile = _cognitiveProfileService.GetProfile(GetUserId());
        return Ok(profile);
    }

    /// <summary>
    /// Retorna o histórico de sobrecarga, energia e tarefas dos últimos 7 dias.
    /// </summary>
    [HttpGet("history")]
    public IActionResult GetCognitiveHistory([FromQuery] int days = 7)
    {
        var history = _cognitiveProfileService.GetCognitiveHistory(GetUserId(), days);
        return Ok(history);
    }

    /// <summary>
    /// Força o recálculo do Perfil Cognitivo utilizando o histórico completo de eventos.
    /// </summary>
    [HttpPost("profile/recalculate")]
    public IActionResult RecalculateProfile()
    {
        var profile = _cognitiveProfileService.RecalculateProfile(GetUserId());
        return Ok(profile);
    }

    /// <summary>
    /// Retorna o índice e a classificação de sobrecarga cognitiva atual do usuário.
    /// </summary>
    [HttpGet("load")]
    public IActionResult GetCognitiveLoad()
    {
        var load = _cognitiveLoadService.GetCognitiveLoad(GetUserId());
        return Ok(load);
    }

    /// <summary>
    /// Retorna recomendações personalizadas com base no estado mental e de energia do usuário.
    /// </summary>
    [HttpGet("/api/recommendations")]
    public IActionResult GetRecommendations()
    {
        var recommendations = _recommendationEngine.GetRecommendations(GetUserId());
        return Ok(recommendations);
    }

    /// <summary>
    /// Registra o nível de energia diário do usuário.
    /// </summary>
    [HttpPost("/api/energy")]
    public IActionResult RegisterEnergy([FromBody] EnergyRegistrationRequest request)
    {
        var userId = GetUserId();
        var activityEvent = new UserActivityEvent
        {
            UserId = userId,
            EventType = "EnergyRegistered",
            Timestamp = DateTime.UtcNow,
            EnergyLevel = request.EnergyLevel,
            Description = $"Nível de energia informado pelo usuário: {request.EnergyLevel}"
        };

        _behaviorRepository.SaveEvent(activityEvent);
        _cognitiveProfileService.RecalculateProfile(userId);

        return Accepted();
    }

    /// <summary>
    /// Registra um evento arbitrário no Event Store comportamental.
    /// </summary>
    [HttpPost("/api/events")]
    public IActionResult PostEvent([FromBody] UserActivityEvent activityEvent)
    {
        var userId = GetUserId();
        var authenticatedEvent = new UserActivityEvent
        {
            UserId = userId,
            EventType = activityEvent.EventType,
            Timestamp = DateTime.UtcNow,
            Description = activityEvent.Description,
            Category = activityEvent.Category,
            EstimatedMinutes = activityEvent.EstimatedMinutes,
            EnergyLevel = activityEvent.EnergyLevel,
            Mood = activityEvent.Mood,
            Completed = activityEvent.Completed
        };

        _behaviorRepository.SaveEvent(authenticatedEvent);
        _cognitiveProfileService.RecalculateProfile(userId);

        return Accepted();
    }

    /// <summary>
    /// Consulta todas as tarefas planejadas do usuário.
    /// </summary>
    [HttpGet("/api/tasks")]
    public IActionResult GetTasks()
    {
        var tasks = _taskRepository.GetByUserId(GetUserId());
        return Ok(tasks);
    }

    /// <summary>
    /// Cria e planeja uma tarefa aplicando desmembramento automático e estimativa inteligente.
    /// </summary>
    [HttpPost("/api/tasks")]
    public IActionResult CreateTask([FromBody] UserTask task)
    {
        var planned = _planningEngine.PlanAndSplitTask(task, GetUserId());
        return Created($"/api/tasks/{task.Id}", planned);
    }

    /// <summary>
    /// Dispara o replanejamento automático de tarefas pendentes em cascata.
    /// </summary>
    [HttpPost("/api/planning/rebuild")]
    public IActionResult RebuildSchedule()
    {
        var userId = GetUserId();
        _planningEngine.RebuildSchedule(userId);
        return Ok(new { Message = "Cronograma reorganizado com sucesso para evitar conflitos." });
    }

    /// <summary>
    /// Conclui uma tarefa planejada, disparando o log comportamental no Event Store.
    /// </summary>
    [HttpPost("/api/tasks/{id}/complete")]
    public IActionResult CompleteTask(int id, [FromBody] TaskCompletionRequest? request)
    {
        var userId = GetUserId();
        var task = _taskRepository.GetById(id);
        if (task == null || task.UserId != userId)
        {
            return NotFound("Tarefa não encontrada.");
        }

        task.Status = "Completed";
        task.CompletedAt = DateTime.UtcNow;
        task.ActualMinutes = request?.ActualMinutes ?? task.EstimatedMinutes;
        _taskRepository.Save(task);

        _behaviorRepository.SaveEvent(new UserActivityEvent
        {
            UserId = userId,
            EventType = "TaskCompleted",
            Timestamp = DateTime.UtcNow,
            Description = task.Title,
            Category = task.Category,
            EstimatedMinutes = task.EstimatedMinutes,
            Completed = true
        });

        _cognitiveProfileService.RecalculateProfile(userId);

        return Ok(task);
    }

    /// <summary>
    /// Adia uma tarefa planejada, disparando o replanejamento automático em cascata.
    /// </summary>
    [HttpPost("/api/tasks/{id}/delay")]
    public IActionResult DelayTask(int id)
    {
        var userId = GetUserId();
        var task = _taskRepository.GetById(id);
        if (task == null || task.UserId != userId)
        {
            return NotFound("Tarefa não encontrada.");
        }

        task.Status = "Delayed";
        _taskRepository.Save(task);

        _behaviorRepository.SaveEvent(new UserActivityEvent
        {
            UserId = userId,
            EventType = "TaskDelayed",
            Timestamp = DateTime.UtcNow,
            Description = task.Title,
            Category = task.Category,
            EstimatedMinutes = task.EstimatedMinutes,
            Completed = false
        });

        _planningEngine.RebuildSchedule(userId);
        _cognitiveProfileService.RecalculateProfile(userId);

        return Ok(new { Message = "Tarefa adiada e cronograma subsequente replanejado.", Task = task });
    }

    /// <summary>
    /// Retorna as predições de risco de procrastinação para todas as tarefas ativas.
    /// </summary>
    [HttpGet("/api/predictions")]
    public IActionResult GetPredictions()
    {
        var predictions = _predictionEngine.GetPredictions(GetUserId());
        return Ok(predictions);
    }

    /// <summary>
    /// Otimiza o agendamento de uma tarefa para o melhor horário de produtividade do usuário.
    /// </summary>
    [HttpPost("/api/tasks/{id}/optimize")]
    public IActionResult OptimizeTask(int id)
    {
        var userId = GetUserId();
        var task = _taskRepository.GetById(id);
        if (task == null || task.UserId != userId)
        {
            return NotFound("Tarefa não encontrada.");
        }

        var profile = _cognitiveProfileService.GetProfile(userId);
        int targetHour = 9;

        if (!string.IsNullOrEmpty(profile.BestProductivityHour) && profile.BestProductivityHour != "Ainda sem dados")
        {
            var parts = profile.BestProductivityHour.Split(':');
            if (parts.Length > 0 && int.TryParse(parts[0], out int h))
            {
                targetHour = h;
            }
        }

        // Sugere o melhor horário para amanhã para evitar conflito com tarefas de hoje
        var now = DateTime.UtcNow;
        var optimizedTime = new DateTime(now.Year, now.Month, now.Day, targetHour, 0, 0, DateTimeKind.Utc).AddDays(1);
        
        task.SuggestedTime = optimizedTime;
        task.DueDate = optimizedTime.AddMinutes(task.EstimatedMinutes);
        task.Status = "Rescheduled";
        _taskRepository.Save(task);

        // Dispara evento no Event Store
        _behaviorRepository.SaveEvent(new UserActivityEvent
        {
            UserId = userId,
            EventType = "TaskRescheduled",
            Timestamp = DateTime.UtcNow,
            Description = $"Tarefa otimizada para horário nobre: {task.Title}",
            Category = task.Category,
            EstimatedMinutes = task.EstimatedMinutes
        });

        // Resolve conflitos da agenda
        _planningEngine.RebuildSchedule(userId);
        _cognitiveProfileService.RecalculateProfile(userId);

        return Ok(new { Message = "Horário otimizado com sucesso.", Task = task });
    }
}
