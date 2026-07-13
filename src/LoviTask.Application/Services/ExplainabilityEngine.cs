using LoviTask.Application.Interfaces;
using LoviTask.Domain.Models;
using System;
using System.Text;

namespace LoviTask.Application.Services;

public class ExplainabilityEngine : IExplainabilityEngine
{
    public string ExplainRecommendation(Recommendation recommendation, CognitiveProfile profile, double currentEnergy)
    {
        if (recommendation.Category == "Energia")
        {
            if (profile.CognitiveLoad >= 80)
            {
                return $"Seu nível de sobrecarga cognitiva está crítico ({profile.CognitiveLoad}%). O repouso imediato ou o foco em microtarefas é essencial para evitar o esgotamento mental.";
            }
            if (currentEnergy <= 3)
            {
                return $"Você registrou energia baixa ({currentEnergy}/10) recentemente. Atividades leves de pouca demanda cognitiva são mais adequadas agora.";
            }
        }

        if (recommendation.Category == "Rotina")
        {
            if (!string.IsNullOrEmpty(profile.BestProductivityHour) && !string.IsNullOrEmpty(profile.WorstProductivityHour))
            {
                return $"Sua melhor janela de foco ocorre historicamente às {profile.BestProductivityHour}, enquanto o período das {profile.WorstProductivityHour} apresenta a maior taxa de adiamentos. Ajustar sua agenda protege seu ritmo natural.";
            }
        }

        if (recommendation.Category == "Motivação")
        {
            if (profile.ConsistencyScore < 40)
            {
                return $"Sua consistência semanal está abaixo da média ({profile.ConsistencyScore}%). Completar pequenas tarefas de até 10 minutos ajuda a reconstruir o hábito de foco sem estresse.";
            }
        }

        return "Esta recomendação foi personalizada com base nos seus dados históricos de engajamento, consistência semanal e padrões horários de conclusão de tarefas.";
    }

    public string ExplainProcrastinationRisk(double riskPercentage, string taskType, int hour, double currentEnergy, CognitiveProfile profile)
    {
        var sb = new StringBuilder();
        sb.Append($"Probabilidade de procrastinação estimada em {riskPercentage:0}%. ");

        var reasons = new System.Collections.Generic.List<string>();

        if (currentEnergy <= 3)
        {
            reasons.Add("sua energia atual está baixa, o que dificulta o início de tarefas complexas");
        }

        if (!string.IsNullOrEmpty(profile.WorstProductivityHour) && profile.WorstProductivityHour.StartsWith($"{hour:D2}"))
        {
            reasons.Add("este horário coincide com sua janela histórica de maior distração ou fadiga");
        }

        if (profile.ProcrastinationIndex >= 60)
        {
            reasons.Add("seu índice geral de procrastinação recente está elevado");
        }

        if (reasons.Count > 0)
        {
            sb.Append("Fatores identificados: " + string.Join("; ", reasons) + ".");
        }
        else
        {
            sb.Append("Com base no seu perfil, esta tarefa possui características neutras e adequadas ao seu momento atual.");
        }

        return sb.ToString();
    }
}
