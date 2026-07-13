using LoviTask.Domain.Models;

namespace LoviTask.Application.Interfaces;

public interface IExplainabilityEngine
{
    string ExplainRecommendation(Recommendation recommendation, CognitiveProfile profile, double currentEnergy);
    string ExplainProcrastinationRisk(double riskPercentage, string taskType, int hour, double currentEnergy, CognitiveProfile profile);
}
