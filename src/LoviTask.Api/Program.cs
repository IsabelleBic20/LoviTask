using LoviTask.Application.Interfaces;
using LoviTask.Application.Services;
using LoviTask.Infrastructure.Repositories;
using LoviTask.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSingleton<IBehaviorRepository, InMemoryBehaviorRepository>();
builder.Services.AddSingleton<IBrainDumpAiProvider, BrainDumpAiProvider>();
builder.Services.AddSingleton<IPersonalizationEngine, PersonalizationEngine>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();
