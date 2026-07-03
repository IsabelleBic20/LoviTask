using LoviTask.Domain.Events;
using LoviTask.Domain.Models;

namespace LoviTask.Application.Interfaces;

public interface IPersonalizationMetricsProvider
{
    PersonalizationMetrics BuildMetrics(IEnumerable<UserActivityEvent> history);
}
