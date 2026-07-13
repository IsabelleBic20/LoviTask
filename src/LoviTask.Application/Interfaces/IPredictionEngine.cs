using LoviTask.Domain.Models;
using System.Collections.Generic;

namespace LoviTask.Application.Interfaces;

public interface IPredictionEngine
{
    List<PredictionResult> GetPredictions(string userId);
    PredictionResult CalculatePrediction(UserTask task, string userId);
}
