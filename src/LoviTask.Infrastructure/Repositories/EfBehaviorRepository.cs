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
            _dbContext.UserActivityEvents.Update(activityEvent);
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
