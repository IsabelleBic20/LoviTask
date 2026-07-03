using LoviTask.Domain.Events;
using Microsoft.EntityFrameworkCore;

namespace LoviTask.Infrastructure.Data;

public class LoviTaskDbContext : DbContext
{
    public LoviTaskDbContext(DbContextOptions<LoviTaskDbContext> options)
        : base(options)
    {
    }

    public DbSet<UserActivityEvent> UserActivityEvents { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserActivityEvent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Timestamp).IsRequired();
            entity.Property(e => e.EventType).HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Category).HasMaxLength(100);
        });
    }
}
