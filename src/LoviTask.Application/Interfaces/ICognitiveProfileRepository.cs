using LoviTask.Domain.Models;

namespace LoviTask.Application.Interfaces;

public interface ICognitiveProfileRepository
{
    CognitiveProfile? GetProfile(string userId);
    void SaveProfile(CognitiveProfile profile);
}
