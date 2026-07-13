using LoviTask.Application.Interfaces;
using LoviTask.Domain.Events;
using LoviTask.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace LoviTask.Application.Services;

public class CognitiveProfileService : ICognitiveProfileService
{
    private readonly IBehaviorRepository _behaviorRepository;
    private readonly ICognitiveProfileRepository _profileRepository;
    private readonly ICognitiveLoadService _cognitiveLoadService;

    public CognitiveProfileService(
        IBehaviorRepository behaviorRepository,
        ICognitiveProfileRepository profileRepository,
        ICognitiveLoadService cognitiveLoadService)
    {
        _behaviorRepository = behaviorRepository;
        _profileRepository = profileRepository;
        _cognitiveLoadService = cognitiveLoadService;
    }

    public CognitiveProfile GetProfile(string userId)
    {
        var profile = _profileRepository.GetProfile(userId);
        if (profile == null)
        {
            profile = RecalculateProfile(userId);
        }
        return profile;
    }

    public List<CognitiveHistoryDay> GetCognitiveHistory(string userId, int days = 7)
    {
        var events = _behaviorRepository.GetEvents(userId).ToList();
        var history = new List<CognitiveHistoryDay>();

        var dateRange = Enumerable.Range(0, days)
            .Select(i => DateTime.UtcNow.Date.AddDays(-i))
            .OrderBy(d => d)
            .ToList();

        foreach (var day in dateRange)
        {
            var dayEvents = events.Where(e => e.Timestamp.Date == day).ToList();

            var energyEvents = dayEvents.Where(e => e.EventType == "EnergyRegistered" && e.EnergyLevel.HasValue).ToList();
            double avgEnergy = energyEvents.Any() ? energyEvents.Average(e => e.EnergyLevel!.Value) : 5.0;

            int completedCount = dayEvents.Count(e => e.EventType == "TaskCompleted" || (e.EventType == "TaskCreated" && e.Completed == true));
            int delayedCount = dayEvents.Count(e => e.EventType == "TaskDelayed" || (e.EventType == "TaskCreated" && e.Completed == false));

            double calculatedLoad = 30.0;
            calculatedLoad += (delayedCount * 15.0);
            calculatedLoad -= (completedCount * 5.0);
            calculatedLoad += (10.0 - avgEnergy) * 5.0;
            calculatedLoad = Math.Clamp(calculatedLoad, 10.0, 95.0);

            history.Add(new CognitiveHistoryDay
            {
                Date = day.ToString("yyyy-MM-dd"),
                AverageCognitiveLoad = Math.Round(calculatedLoad, 0),
                AverageEnergy = Math.Round(avgEnergy, 1),
                TasksCompleted = completedCount,
                TasksDelayed = delayedCount
            });
        }

        return history;
    }

    public CognitiveProfile RecalculateProfile(string userId)
    {
        var events = _behaviorRepository.GetEvents(userId).ToList();

        var profile = new CognitiveProfile
        {
            UserId = userId,
            LastUpdated = DateTime.UtcNow
        };

        if (!events.Any())
        {
            profile.Summary = "Ainda não há dados suficientes para traçar seu perfil cognitivo. Comece a criar e concluir tarefas!";
            profile.BestProductivityHour = "Ainda sem dados";
            profile.WorstProductivityHour = "Ainda sem dados";
            profile.AverageTaskDuration = 0;
            profile.AverageFocusTime = 0;
            profile.CompletionRate = 0;
            profile.DelayRate = 0;
            profile.ProcrastinationIndex = 0;
            profile.CognitiveLoad = 0;
            profile.ConsistencyScore = 0;
            profile.ProductivityWindow = new ProductivityWindow { Period = "Ainda em análise", Confidence = 0 };
            profile.LowProductivityWindow = new ProductivityWindow { Period = "Ainda em análise", Confidence = 0 };
            profile.Recommendations = Array.Empty<Recommendation>();
            profile.HabitEvolution = Array.Empty<HabitEvolution>();
            profile.EnergyPatterns = Array.Empty<EnergyPattern>();
            profile.MoodPatterns = Array.Empty<MoodPattern>();

            _profileRepository.SaveProfile(profile);
            return profile;
        }

        // Filtra os eventos de tarefas
        var createdTasks = events.Where(e => e.EventType == "TaskCreated" || e.EventType == "task").ToList();
        var completedTasks = events.Where(e => e.EventType == "TaskCompleted" || (e.EventType == "task" && e.Completed == true)).ToList();
        var startedTasks = events.Where(e => e.EventType == "TaskStarted").ToList();
        var delayedTasks = events.Where(e => e.EventType == "TaskDelayed").ToList();

        // 1. Horários de Produtividade
        profile.BestProductivityHour = CalculateBestProductivityHour(completedTasks);
        profile.WorstProductivityHour = CalculateWorstProductivityHour(delayedTasks, events);

        // 2. Taxas básicas de conclusão e adiamento
        int totalCreated = createdTasks.Count;
        int totalCompleted = completedTasks.Count;
        int totalDelayed = delayedTasks.Count;

        profile.CompletionRate = totalCreated > 0 ? Math.Round((double)totalCompleted / totalCreated, 2) : 0;
        profile.DelayRate = totalCreated > 0 ? Math.Round((double)totalDelayed / totalCreated, 2) : 0;

        // 3. Tempo Médio por Tarefa e Tempo de Foco
        profile.AverageTaskDuration = CalculateAverageTaskDuration(startedTasks, completedTasks);
        profile.AverageFocusTime = CalculateAverageFocusTime(events);

        // 4. Índices de Procrastinação, Consistência e Sobrecarga Cognitiva
        profile.ProcrastinationIndex = CalculateProcrastinationIndex(profile.DelayRate, profile.CompletionRate, delayedTasks);
        profile.ConsistencyScore = CalculateConsistencyScore(completedTasks);
        profile.CognitiveLoad = _cognitiveLoadService.GetCognitiveLoad(userId).Score;

        // 5. Mapeamentos legados e complementares
        profile.ProductivityWindow = GetDominantPeriod(completedTasks);
        profile.LowProductivityWindow = GetDominantPeriod(delayedTasks);
        profile.Recommendations = GenerateHeuristicRecommendations(profile);
        profile.Summary = GenerateCognitiveSummary(profile);
        
        // Padrões de energia, humor e hábitos
        profile.EnergyPatterns = BuildEnergyPatterns(events);
        profile.MoodPatterns = BuildMoodPatterns(events);
        profile.HabitEvolution = BuildHabitEvolution(events);

        _profileRepository.SaveProfile(profile);
        return profile;
    }

    private string CalculateBestProductivityHour(List<UserActivityEvent> completedTasks)
    {
        if (!completedTasks.Any()) return "Ainda sem dados";

        var bestHour = completedTasks
            .GroupBy(t => t.Timestamp.Hour)
            .OrderByDescending(g => g.Count())
            .First()
            .Key;

        return $"{bestHour:D2}:00";
    }

    private string CalculateWorstProductivityHour(List<UserActivityEvent> delayedTasks, List<UserActivityEvent> allEvents)
    {
        if (delayedTasks.Any())
        {
            var worstHour = delayedTasks
                .GroupBy(t => t.Timestamp.Hour)
                .OrderByDescending(g => g.Count())
                .First()
                .Key;
            return $"{worstHour:D2}:00";
        }

        var abandonedTasks = allEvents.Where(e => e.Completed == false).ToList();
        if (abandonedTasks.Any())
        {
            var worstHour = abandonedTasks
                .GroupBy(t => t.Timestamp.Hour)
                .OrderByDescending(g => g.Count())
                .First()
                .Key;
            return $"{worstHour:D2}:00";
        }

        return "23:00"; // Padrão heurístico (fim de noite/fadiga)
    }

    private double CalculateAverageTaskDuration(List<UserActivityEvent> startedTasks, List<UserActivityEvent> completedTasks)
    {
        var durations = new List<double>();
        foreach (var completed in completedTasks)
        {
            var started = startedTasks
                .Where(s => s.Description == completed.Description && s.Timestamp < completed.Timestamp)
                .OrderByDescending(s => s.Timestamp)
                .FirstOrDefault();

            if (started != null)
            {
                var diff = (completed.Timestamp - started.Timestamp).TotalMinutes;
                if (diff > 0 && diff < 480) // Limite de 8h
                {
                    durations.Add(diff);
                }
            }
        }

        if (durations.Any())
        {
            return Math.Round(durations.Average(), 1);
        }

        // Fallback: usar EstimatedMinutes
        var estimatedAvg = completedTasks
            .Where(e => e.EstimatedMinutes.HasValue && e.EstimatedMinutes.Value > 0)
            .Select(e => (double)e.EstimatedMinutes!.Value)
            .DefaultIfEmpty(35.0)
            .Average();

        return Math.Round(estimatedAvg, 1);
    }

    private double CalculateAverageFocusTime(List<UserActivityEvent> events)
    {
        var focusStarted = events.Where(e => e.EventType == "FocusSessionStarted").ToList();
        var focusEnded = events.Where(e => e.EventType == "FocusSessionEnded").ToList();
        var focusTimes = new List<double>();

        foreach (var ended in focusEnded)
        {
            var started = focusStarted
                .Where(s => s.Timestamp < ended.Timestamp)
                .OrderByDescending(s => s.Timestamp)
                .FirstOrDefault();

            if (started != null)
            {
                var diff = (ended.Timestamp - started.Timestamp).TotalMinutes;
                if (diff > 0 && diff < 180) // Limite de 3h
                {
                    focusTimes.Add(diff);
                }
            }
        }

        if (focusTimes.Any())
        {
            return Math.Round(focusTimes.Average(), 1);
        }

        return 25.0; // Pomodoro padrão
    }

    private double CalculateProcrastinationIndex(double delayRate, double completionRate, List<UserActivityEvent> delayedTasks)
    {
        double index = (delayRate * 0.6 + (1 - completionRate) * 0.4) * 100;
        
        if (delayedTasks.Any(t => t.Timestamp >= DateTime.UtcNow.AddDays(-3)))
        {
            index += 10;
        }

        return Math.Clamp(Math.Round(index, 0), 0, 100);
    }

    private double CalculateConsistencyScore(List<UserActivityEvent> completedTasks)
    {
        if (!completedTasks.Any()) return 0;

        var last7Days = Enumerable.Range(0, 7)
            .Select(i => DateTime.UtcNow.Date.AddDays(-i))
            .ToList();

        int daysWithCompletedTask = 0;
        foreach (var day in last7Days)
        {
            bool hasCompleted = completedTasks.Any(t => t.Timestamp.Date == day);
            if (hasCompleted)
            {
                daysWithCompletedTask++;
            }
        }

        double score = (double)daysWithCompletedTask / 7 * 100;
        return Math.Round(score, 0);
    }


    private static ProductivityWindow GetDominantPeriod(IEnumerable<UserActivityEvent> events)
    {
        var list = events.ToList();
        if (!list.Any())
        {
            return new ProductivityWindow { Period = "Ainda em análise", Confidence = 0 };
        }

        var group = list
            .GroupBy(e => GetTimeOfDay(e.Timestamp))
            .Select(g => new { Period = g.Key, Count = g.Count() })
            .OrderByDescending(g => g.Count)
            .FirstOrDefault();

        if (group is null)
        {
            return new ProductivityWindow { Period = "Ainda em análise", Confidence = 0 };
        }

        var total = list.Count;
        return new ProductivityWindow
        {
            Period = group.Period,
            Confidence = total > 0 ? Math.Round(group.Count / (double)total, 2) : 0
        };
    }

    private static string GetTimeOfDay(DateTime timestamp)
    {
        return timestamp.Hour switch
        {
            < 12 => "Manhã",
            < 18 => "Tarde",
            _ => "Noite"
        };
    }

    private Recommendation[] GenerateHeuristicRecommendations(CognitiveProfile profile)
    {
        var list = new List<Recommendation>();

        if (profile.CognitiveLoad >= 80)
        {
            list.Add(new Recommendation
            {
                Title = "Modo Crise Ativado: Reduza o Ritmo",
                Description = "Sua sobrecarga cognitiva está crítica. Evite adicionar novas tarefas hoje e foque em descansar ou concluir no máximo 2 microtarefas simples.",
                Category = "Energia"
            });
        }
        else if (profile.CognitiveLoad >= 60)
        {
            list.Add(new Recommendation
            {
                Title = "Sinal Amarelo de Sobrecarga",
                Description = "A sobrecarga cognitiva está moderada para alta. Considere dividir tarefas grandes em pedaços menores e evite reuniões longas.",
                Category = "Foco"
            });
        }

        if (profile.ProcrastinationIndex >= 60)
        {
            list.Add(new Recommendation
            {
                Title = "Estratégia Anti-procrastinação",
                Description = $"Você tende a adiar tarefas por volta das {profile.WorstProductivityHour}. Mova atividades longas para o seu melhor horário às {profile.BestProductivityHour}.",
                Category = "Rotina"
            });
        }

        if (profile.ConsistencyScore < 40 && profile.ConsistencyScore > 0)
        {
            list.Add(new Recommendation
            {
                Title = "Recupere o ritmo aos poucos",
                Description = "Sua consistência está baixa. Tente fazer apenas uma tarefa muito pequena hoje para reativar seu hábito.",
                Category = "Motivação"
            });
        }

        if (profile.CompletionRate >= 0.8)
        {
            list.Add(new Recommendation
            {
                Title = "Consistência Excelente!",
                Description = "Você está com uma taxa de conclusão incrível. Continue mantendo sessões de foco curtas para manter esse alto desempenho.",
                Category = "Foco"
            });
        }

        if (!list.Any())
        {
            list.Add(new Recommendation
            {
                Title = "Continue registrando atividades",
                Description = "Parabéns por cuidar da sua organização! Continue registrando seus eventos de foco para receber recomendações adaptativas.",
                Category = "Apoio"
            });
        }

        return list.ToArray();
    }

    private string GenerateCognitiveSummary(CognitiveProfile profile)
    {
        if (profile.CognitiveLoad >= 80)
        {
            return "Seu cérebro está operando em limite crítico de sobrecarga. Recomenda-se suspender o planejamento denso e priorizar atividades de relaxamento.";
        }
        if (profile.ProcrastinationIndex >= 60)
        {
            return $"Seu perfil cognitivo detectou picos de procrastinação por volta das {profile.WorstProductivityHour}. Tente programar atividades complexas para as {profile.BestProductivityHour}, onde seu foco está no máximo.";
        }
        return $"Seu ritmo de trabalho está saudável. Você tem maior taxa de conclusão às {profile.BestProductivityHour} e uma consistência de {profile.ConsistencyScore}%. Continue assim!";
    }

    private static EnergyPattern[] BuildEnergyPatterns(IEnumerable<UserActivityEvent> history)
    {
        return history
            .Where(e => e.EnergyLevel.HasValue)
            .GroupBy(e => e.Timestamp.DayOfWeek)
            .Select(g => new EnergyPattern
            {
                DayOfWeek = g.Key.ToString(),
                EnergyLevel = DescribeEnergy(g.Average(e => e.EnergyLevel!.Value))
            })
            .OrderBy(p => p.DayOfWeek)
            .ToArray();
    }

    private static string DescribeEnergy(double averageEnergy)
    {
        if (averageEnergy >= 7) return "Alta";
        if (averageEnergy >= 4) return "Média";
        return "Baixa";
    }

    private static MoodPattern[] BuildMoodPatterns(IEnumerable<UserActivityEvent> history)
    {
        return history
            .Where(e => !string.IsNullOrWhiteSpace(e.Mood))
            .GroupBy(e => new { e.Timestamp.DayOfWeek, Mood = e.Mood! })
            .Select(g => new { g.Key.DayOfWeek, Mood = g.Key.Mood, Count = g.Count() })
            .GroupBy(g => g.DayOfWeek)
            .Select(g => g.OrderByDescending(x => x.Count).First())
            .Select(g => new MoodPattern
            {
                DayOfWeek = g.DayOfWeek.ToString(),
                MoodSummary = g.Mood
            })
            .OrderBy(p => p.DayOfWeek)
            .ToArray();
    }

    private static HabitEvolution[] BuildHabitEvolution(IEnumerable<UserActivityEvent> history)
    {
        var eventsByCategory = history.GroupBy(e => e.Category ?? "Sem categoria");
        return eventsByCategory
            .Select(g =>
            {
                var completed = g.Count(e => e.Completed == true || e.EventType == "TaskCompleted");
                var total = g.Count();
                var lastWeek = g.Count(e => e.Timestamp >= DateTime.UtcNow.AddDays(-7));
                var previousWeek = g.Count(e => e.Timestamp < DateTime.UtcNow.AddDays(-7) && e.Timestamp >= DateTime.UtcNow.AddDays(-14));
                return new HabitEvolution
                {
                    HabitName = g.Key,
                    Consistency = total > 0 ? Math.Round(completed / (double)total, 2) : 0,
                    Trend = previousWeek == 0
                        ? "Em evolução"
                        : lastWeek >= previousWeek ? "Subindo" : "Estável"
                };
            })
            .OrderByDescending(h => h.Consistency)
            .Take(5)
            .ToArray();
    }
}
