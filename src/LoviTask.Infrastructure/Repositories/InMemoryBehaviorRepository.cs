using LoviTask.Application.Interfaces;
using LoviTask.Domain.Events;

namespace LoviTask.Infrastructure.Repositories;

public class InMemoryBehaviorRepository : IBehaviorRepository
{
    private readonly List<UserActivityEvent> _events = new();

    public void SaveEvent(UserActivityEvent activityEvent)
    {
        _events.Add(activityEvent);
    }

    public IReadOnlyList<UserActivityEvent> GetEvents() => _events;
}
