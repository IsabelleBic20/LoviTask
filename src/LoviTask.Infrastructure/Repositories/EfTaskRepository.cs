using LoviTask.Application.Interfaces;
using LoviTask.Domain.Models;
using LoviTask.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;

namespace LoviTask.Infrastructure.Repositories;

public class EfTaskRepository : ITaskRepository
{
    private readonly LoviTaskDbContext _dbContext;

    public EfTaskRepository(LoviTaskDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public UserTask? GetById(int id)
    {
        return _dbContext.UserTasks.FirstOrDefault(t => t.Id == id);
    }

    public IReadOnlyList<UserTask> GetByUserId(string userId)
    {
        return _dbContext.UserTasks
            .AsNoTracking()
            .Where(t => t.UserId == userId)
            .ToList();
    }

    public void Save(UserTask task)
    {
        if (task.Id > 0)
        {
            var existing = _dbContext.UserTasks.FirstOrDefault(t => t.Id == task.Id);
            if (existing != null)
            {
                _dbContext.Entry(existing).CurrentValues.SetValues(task);
            }
            else
            {
                _dbContext.UserTasks.Add(task);
            }
        }
        else
        {
            _dbContext.UserTasks.Add(task);
        }
        _dbContext.SaveChanges();
    }

    public void Delete(int id)
    {
        var task = _dbContext.UserTasks.FirstOrDefault(t => t.Id == id);
        if (task != null)
        {
            _dbContext.UserTasks.Remove(task);
            _dbContext.SaveChanges();
        }
    }
}
