using LoviTask.Domain.Models;
using System.Collections.Generic;

namespace LoviTask.Application.Interfaces;

public interface ITaskRepository
{
    UserTask? GetById(int id);
    IReadOnlyList<UserTask> GetByUserId(string userId);
    void Save(UserTask task);
    void Delete(int id);
}
