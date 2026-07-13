using LoviTask.Application.Interfaces;
using LoviTask.Domain.Events;
using LoviTask.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LoviTask.Infrastructure.Repositories;

public class EfBehaviorRepository : IBehaviorRepository
{
    private readonly LoviTaskDbContext _dbContext;

    public EfBehaviorRepository(LoviTaskDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public void SaveEvent(UserActivityEvent activityEvent)
    {
        if (activityEvent.Id > 0)
        {
            var existing = _dbContext.UserActivityEvents.FirstOrDefault(e => e.Id == activityEvent.Id);
            if (existing != null)
            {
                _dbContext.Entry(existing).CurrentValues.SetValues(activityEvent);
            }
            else
            {
                _dbContext.UserActivityEvents.Add(activityEvent);
            }
        }
        else
        {
            _dbContext.UserActivityEvents.Add(activityEvent);
        }
        _dbContext.SaveChanges();
    }

    public IReadOnlyList<UserActivityEvent> GetEvents(string userId)
    {
        return _dbContext.UserActivityEvents
            .AsNoTracking()
            .Where(e => e.UserId == userId)
            .OrderBy(e => e.Timestamp)
            .ToList();
    }
}
