using LoviTask.Domain.Events;
using LoviTask.Domain.Models;

namespace LoviTask.Application.Interfaces;

public interface IPersonalizationEngine
{
    void TrackEvent(UserActivityEvent activityEvent);
    CognitiveProfile BuildCognitiveProfile(string userId);
    PersonalizationMetrics BuildPersonalizationMetrics(string userId);
    Recommendation[] GenerateRecommendations(string userId);
}
