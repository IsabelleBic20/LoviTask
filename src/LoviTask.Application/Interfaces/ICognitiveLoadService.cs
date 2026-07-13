using LoviTask.Domain.Models;

namespace LoviTask.Application.Interfaces;

public interface ICognitiveLoadService
{
    CognitiveLoadResult GetCognitiveLoad(string userId);
}
