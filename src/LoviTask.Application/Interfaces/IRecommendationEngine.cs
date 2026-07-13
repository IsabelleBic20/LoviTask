using LoviTask.Domain.Models;

namespace LoviTask.Application.Interfaces;

public interface IRecommendationEngine
{
    Recommendation[] GetRecommendations(string userId);
}
