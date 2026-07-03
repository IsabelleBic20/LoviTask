using LoviTask.Domain.Events;

namespace LoviTask.Application.Interfaces;

public interface IBehaviorRepository
{
    void SaveEvent(UserActivityEvent activityEvent);
    IReadOnlyList<UserActivityEvent> GetEvents();
}
