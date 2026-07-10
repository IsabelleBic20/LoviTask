using LoviTask.Application.Interfaces;
using LoviTask.Domain.Events;

namespace LoviTask.Infrastructure.Repositories;

public class InMemoryBehaviorRepository : IBehaviorRepository
{
    private readonly List<UserActivityEvent> _events = new();

    public void SaveEvent(UserActivityEvent activityEvent)
    {
        if (activityEvent.Id > 0)
        {
            var index = _events.FindIndex(e => e.Id == activityEvent.Id);
            if (index >= 0)
            {
                _events[index] = activityEvent;
                return;
            }
        }
        _events.Add(activityEvent);
    }

    public IReadOnlyList<UserActivityEvent> GetEvents(string userId) =>
        _events.Where(e => e.UserId == userId).ToList();
}
