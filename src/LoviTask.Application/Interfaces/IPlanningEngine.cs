using LoviTask.Domain.Models;
using System.Collections.Generic;

namespace LoviTask.Application.Interfaces;

public interface IPlanningEngine
{
    List<UserTask> PlanAndSplitTask(UserTask task, string userId);
    void RebuildSchedule(string userId);
}
