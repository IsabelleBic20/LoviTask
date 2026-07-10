using System.Reflection;
using LoviTask.Application.Interfaces;
using LoviTask.Application.Services;
using LoviTask.Infrastructure.Data;
using LoviTask.Infrastructure.Repositories;
using LoviTask.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "LoviTask API",
        Version = "v1",
        Description = "API para personalização cognitiva, métricas de produtividade e Brain Dump inteligente com metas e prazos."
    });

    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    options.IncludeXmlComments(xmlPath);
});

var dbPath = builder.Configuration["DB_PATH"] ?? builder.Configuration["LOVITASK_DATABASE_PATH"];
var connectionString = !string.IsNullOrWhiteSpace(dbPath)
    ? $"Data Source={dbPath}"
    : builder.Configuration.GetConnectionString("LoviTaskDatabase");

builder.Services.AddDbContext<LoviTaskDbContext>(options =>
    options.UseSqlite(connectionString));

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

app.UseCors("AllowAll");
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();
