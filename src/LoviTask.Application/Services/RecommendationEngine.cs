using LoviTask.Application.Interfaces;
using LoviTask.Domain.Models;
using System;
using System.Collections.Generic;

namespace LoviTask.Application.Services;

public class RecommendationEngine : IRecommendationEngine
{
    private readonly ICognitiveProfileService _cognitiveProfileService;
    private readonly ICognitiveLoadService _cognitiveLoadService;
    private readonly IExplainabilityEngine _explainabilityEngine;

    public RecommendationEngine(
        ICognitiveProfileService cognitiveProfileService,
        ICognitiveLoadService cognitiveLoadService,
        IExplainabilityEngine explainabilityEngine)
    {
        _cognitiveProfileService = cognitiveProfileService;
        _cognitiveLoadService = cognitiveLoadService;
        _explainabilityEngine = explainabilityEngine;
    }

    public Recommendation[] GetRecommendations(string userId)
    {
        var profile = _cognitiveProfileService.GetProfile(userId);
        var load = _cognitiveLoadService.GetCognitiveLoad(userId);
        double energy = load.UserEnergyLevel ?? 5.0;

        var recommendations = new List<Recommendation>();

        // 1. Recomendações baseadas na Sobrecarga Cognitiva
        if (load.Score >= 80)
        {
            var rec = new Recommendation
            {
                Title = "Modo Crise: Pausa Imediata Recomendada",
                Description = "Seu cérebro apresenta sobrecarga crítica. Evite iniciar novos projetos e esconda tarefas não urgentes.",
                Category = "Energia"
            };
            rec.Explanation = _explainabilityEngine.ExplainRecommendation(rec, profile, energy);
            rec.Description = $"{rec.Description} ({rec.Explanation})";
            recommendations.Add(rec);
        }
        else if (load.Score >= 60)
        {
            var rec = new Recommendation
            {
                Title = "Sobrecarga Alta: Limite sua Agenda",
                Description = "A carga cognitiva atual é elevada. Considere quebrar tarefas grandes e delegar ou adiar itens secundários.",
                Category = "Foco"
            };
            rec.Explanation = _explainabilityEngine.ExplainRecommendation(rec, profile, energy);
            rec.Description = $"{rec.Description} ({rec.Explanation})";
            recommendations.Add(rec);
        }

        // 2. Recomendações baseadas na Energia do Usuário
        if (energy <= 3)
        {
            var rec = new Recommendation
            {
                Title = "Priorize Tarefas de Baixa Energia",
                Description = "Seu nível de energia está crítico. Prefira responder e-mails rápidos, organizar mesa de trabalho ou pagar contas.",
                Category = "Energia"
            };
            rec.Explanation = _explainabilityEngine.ExplainRecommendation(rec, profile, energy);
            rec.Description = $"{rec.Description} ({rec.Explanation})";
            recommendations.Add(rec);
        }
        else if (energy >= 8 && load.Score < 60)
        {
            var rec = new Recommendation
            {
                Title = "Pico de Energia: Foque em Tarefas Complexas",
                Description = "Energia alta detectada. Excelente momento para iniciar estudos densos, programar ou escrever artigos.",
                Category = "Foco"
            };
            rec.Explanation = _explainabilityEngine.ExplainRecommendation(rec, profile, energy);
            rec.Description = $"{rec.Description} ({rec.Explanation})";
            recommendations.Add(rec);
        }

        // 3. Recomendações baseadas nos Ritmos do Perfil Cognitivo
        if (profile.ProcrastinationIndex >= 60)
        {
            var rec = new Recommendation
            {
                Title = "Evite Janelas de Procrastinação",
                Description = "Organize suas tarefas mais difíceis fora do seu horário habitual de distração ou fadiga.",
                Category = "Rotina"
            };
            rec.Explanation = _explainabilityEngine.ExplainRecommendation(rec, profile, energy);
            rec.Description = $"{rec.Description} ({rec.Explanation})";
            recommendations.Add(rec);
        }

        if (profile.ConsistencyScore < 40 && profile.ConsistencyScore > 0)
        {
            var rec = new Recommendation
            {
                Title = "Reconstrua sua Consistência",
                Description = "Mantenha o foco ativo estabelecendo metas muito pequenas. Complete apenas uma tarefa rápida hoje.",
                Category = "Motivação"
            };
            rec.Explanation = _explainabilityEngine.ExplainRecommendation(rec, profile, energy);
            rec.Description = $"{rec.Description} ({rec.Explanation})";
            recommendations.Add(rec);
        }

        // Recomendação padrão se nenhuma outra se aplicar
        if (recommendations.Count == 0)
        {
            var rec = new Recommendation
            {
                Title = "Mantenha o Ritmo Atual",
                Description = "Seu ritmo comportamental está saudável. Continue focando em suas tarefas diárias de forma balanceada.",
                Category = "Apoio"
            };
            rec.Explanation = _explainabilityEngine.ExplainRecommendation(rec, profile, energy);
            rec.Description = $"{rec.Description} ({rec.Explanation})";
            recommendations.Add(rec);
        }

        return recommendations.ToArray();
    }
}
