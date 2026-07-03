using LoviTask.Application.Interfaces;
using LoviTask.Domain.Events;
using LoviTask.Domain.Models;

namespace LoviTask.Application.Services;

public class PersonalizationEngine : IPersonalizationEngine
{
    private readonly IBehaviorRepository _behaviorRepository;
    private readonly IBrainDumpAiProvider _brainDumpAiProvider;

    public PersonalizationEngine(
        IBehaviorRepository behaviorRepository,
        IBrainDumpAiProvider brainDumpAiProvider)
    {
        _behaviorRepository = behaviorRepository;
        _brainDumpAiProvider = brainDumpAiProvider;
    }

    public void TrackEvent(UserActivityEvent activityEvent)
    {
        _behaviorRepository.SaveEvent(activityEvent);
    }

    public CognitiveProfile BuildCognitiveProfile()
    {
        var history = _behaviorRepository.GetEvents();
        var profile = new CognitiveProfile
        {
            UserId = history.FirstOrDefault()?.UserId ?? string.Empty,
            Summary = "Seu perfil cognitivo está começando a ganhar forma com base nos seus hábitos.",
            ProductivityWindow = new ProductivityWindow
            {
                Period = "Tarde",
                Confidence = 0.6
            },
            LowProductivityWindow = new ProductivityWindow
            {
                Period = "Manhã",
                Confidence = 0.55
            },
            EnergyPatterns = new[]
            {
                new EnergyPattern { DayOfWeek = "Segunda-feira", EnergyLevel = "Média" },
                new EnergyPattern { DayOfWeek = "Quarta-feira", EnergyLevel = "Alta" }
            },
            MoodPatterns = new[]
            {
                new MoodPattern { DayOfWeek = "Terça-feira", MoodSummary = "Constante e focado" },
                new MoodPattern { DayOfWeek = "Sexta-feira", MoodSummary = "Relaxado" }
            },
            Recommendations = new[]
            {
                new Recommendation
                {
                    Title = "Distribua tarefas curtas à tarde",
                    Description = "Atividades de até 10 minutos tendem a ser mais rapidamente concluídas quando você está com energia mais alta.",
                    Category = "Produtividade"
                }
            },
            HabitEvolution = new[]
            {
                new HabitEvolution
                {
                    HabitName = "Revisão diária",
                    Consistency = 0.74,
                    Trend = "Estável"
                }
            }
        };

        return profile;
    }

    public Recommendation[] GenerateRecommendations()
    {
        return new[]
        {
            new Recommendation
            {
                Title = "Prefira tarefas domésticas no período da tarde",
                Description = "Seu padrão indica menos energia pela manhã. Organize tarefas domésticas mais leves depois do almoço.",
                Category = "Rotina"
            },
            new Recommendation
            {
                Title = "Quebre tarefas longas em microtarefas",
                Description = "Tarefas extensas têm maior chance de abandono; dividir em passos pequenos melhora a motivação.",
                Category = "Foco"
            }
        };
    }
}
