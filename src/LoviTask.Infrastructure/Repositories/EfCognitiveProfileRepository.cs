using LoviTask.Application.Interfaces;
using LoviTask.Domain.Models;
using LoviTask.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace LoviTask.Infrastructure.Repositories;

public class EfCognitiveProfileRepository : ICognitiveProfileRepository
{
    private readonly LoviTaskDbContext _dbContext;

    public EfCognitiveProfileRepository(LoviTaskDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public CognitiveProfile? GetProfile(string userId)
    {
        return _dbContext.CognitiveProfiles
            .AsNoTracking()
            .FirstOrDefault(p => p.UserId == userId);
    }

    public void SaveProfile(CognitiveProfile profile)
    {
        var existing = _dbContext.CognitiveProfiles.FirstOrDefault(p => p.UserId == profile.UserId);
        if (existing != null)
        {
            // EF está rastreando "existing". Atualizar suas propriedades ou usar Update
            _dbContext.Entry(existing).CurrentValues.SetValues(profile);
            
            // Garantir que as propriedades complexas não primitivas (como arrays) sejam marcadas como modificadas,
            // já que SetValues apenas copia propriedades escalares de mesmo nome.
            existing.ProductivityWindow = profile.ProductivityWindow;
            existing.LowProductivityWindow = profile.LowProductivityWindow;
            existing.Recommendations = profile.Recommendations;
            existing.HabitEvolution = profile.HabitEvolution;
            existing.EnergyPatterns = profile.EnergyPatterns;
            existing.MoodPatterns = profile.MoodPatterns;
            
            _dbContext.CognitiveProfiles.Update(existing);
        }
        else
        {
            _dbContext.CognitiveProfiles.Add(profile);
        }
        _dbContext.SaveChanges();
    }
}
