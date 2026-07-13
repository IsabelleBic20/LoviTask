using System;

namespace LoviTask.Domain.Models;

public sealed class UserTask
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string EnergyRequirement { get; set; } = "Média"; // Muito Baixa, Baixa, Média, Alta
    public int EstimatedMinutes { get; set; }
    public int? ActualMinutes { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, InProgress, Paused, Completed, Delayed, Rescheduled
    public string Priority { get; set; } = "Medium"; // Low, Medium, High, Critical
    public int? ParentTaskId { get; set; } // Identificador para microtarefas
    public DateTime? SuggestedTime { get; set; } // Horário sugerido pelo PlanningEngine
    public int? PredecessorTaskId { get; set; } // Dependência
    public string ComplexityEstimate { get; set; } = "Média"; // Fácil, Média, Difícil
}
