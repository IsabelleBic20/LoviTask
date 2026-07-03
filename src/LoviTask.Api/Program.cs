using LoviTask.Application.Interfaces;
using LoviTask.Application.Services;
using LoviTask.Infrastructure.Data;
using LoviTask.Infrastructure.Repositories;
using LoviTask.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<LoviTaskDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("LoviTaskDatabase")));

builder.Services.AddScoped<IBehaviorRepository, EfBehaviorRepository>();
builder.Services.AddSingleton<IBrainDumpAiProvider, BrainDumpAiProvider>();
builder.Services.AddSingleton<IBrainDumpAnalyzer, BrainDumpAnalyzer>();
builder.Services.AddScoped<IPersonalizationMetricsProvider, PersonalizationMetricsProvider>();
builder.Services.AddScoped<IPersonalizationEngine, PersonalizationEngine>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<LoviTaskDbContext>();
    dbContext.Database.EnsureCreated();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();
