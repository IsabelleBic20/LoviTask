using LoviTask.Domain.Models;

namespace LoviTask.Application.Interfaces;

public interface ICognitiveProfileService
{
    CognitiveProfile GetProfile(string userId);
    CognitiveProfile RecalculateProfile(string userId);
    System.Collections.Generic.List<CognitiveHistoryDay> GetCognitiveHistory(string userId, int days = 7);
}
