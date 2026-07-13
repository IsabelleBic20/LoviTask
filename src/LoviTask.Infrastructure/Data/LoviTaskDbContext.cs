using LoviTask.Domain.Events;
using LoviTask.Domain.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace LoviTask.Infrastructure.Data;

public class LoviTaskDbContext : DbContext
{
    public LoviTaskDbContext(DbContextOptions<LoviTaskDbContext> options)
        : base(options)
    {
    }

    public DbSet<UserActivityEvent> UserActivityEvents { get; set; } = null!;
    public DbSet<CognitiveProfile> CognitiveProfiles { get; set; } = null!;
    public DbSet<UserTask> UserTasks { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserTask>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.Property(t => t.UserId).HasMaxLength(150).IsRequired();
            entity.Property(t => t.Title).HasMaxLength(200).IsRequired();
            entity.Property(t => t.Description).HasMaxLength(500);
            entity.Property(t => t.Category).HasMaxLength(100);
            entity.Property(t => t.EnergyRequirement).HasMaxLength(50);
            entity.Property(t => t.Status).HasMaxLength(50);
            entity.Property(t => t.Priority).HasMaxLength(50);
            entity.Property(t => t.ComplexityEstimate).HasMaxLength(50);
        });

        modelBuilder.Entity<UserActivityEvent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Timestamp).IsRequired();
            entity.Property(e => e.EventType).HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Category).HasMaxLength(100);
        });

        modelBuilder.Entity<CognitiveProfile>(entity =>
        {
            entity.HasKey(cp => cp.UserId);
            entity.Property(cp => cp.UserId).HasMaxLength(150);
            entity.Property(cp => cp.Summary).HasMaxLength(1000);
            entity.Property(cp => cp.BestProductivityHour).HasMaxLength(50);
            entity.Property(cp => cp.WorstProductivityHour).HasMaxLength(50);
            entity.Property(cp => cp.LastUpdated).IsRequired();

            // Mapeamentos JSON para o SQLite
            entity.Property(cp => cp.ProductivityWindow)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                    v => JsonSerializer.Deserialize<ProductivityWindow>(v, (JsonSerializerOptions)null!) ?? new ProductivityWindow()
                );

            entity.Property(cp => cp.LowProductivityWindow)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                    v => JsonSerializer.Deserialize<ProductivityWindow>(v, (JsonSerializerOptions)null!) ?? new ProductivityWindow()
                );

            entity.Property(cp => cp.Recommendations)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                    v => JsonSerializer.Deserialize<Recommendation[]>(v, (JsonSerializerOptions)null!) ?? Array.Empty<Recommendation>()
                );

            entity.Property(cp => cp.HabitEvolution)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                    v => JsonSerializer.Deserialize<HabitEvolution[]>(v, (JsonSerializerOptions)null!) ?? Array.Empty<HabitEvolution>()
                );

            entity.Property(cp => cp.EnergyPatterns)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                    v => JsonSerializer.Deserialize<EnergyPattern[]>(v, (JsonSerializerOptions)null!) ?? Array.Empty<EnergyPattern>()
                );

            entity.Property(cp => cp.MoodPatterns)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                    v => JsonSerializer.Deserialize<MoodPattern[]>(v, (JsonSerializerOptions)null!) ?? Array.Empty<MoodPattern>()
                );
        });
    }
}
