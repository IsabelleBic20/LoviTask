using System.Reflection;
using LoviTask.Application.Interfaces;
using LoviTask.Application.Services;
using LoviTask.Infrastructure.Data;
using LoviTask.Infrastructure.Repositories;
using LoviTask.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

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

// Configuração do JWT Bearer Authentication
var jwtKey = builder.Configuration["JWT_SECRET_KEY"] ?? "LoviTaskSuperSecretEncryptionKey1234567890!!";
var key = Encoding.ASCII.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
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

    // Configurar JWT no Swagger UI
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Autenticação JWT Bearer. Digite 'Bearer ' seguido do seu token.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
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
builder.Services.AddScoped<ICognitiveProfileRepository, EfCognitiveProfileRepository>();
builder.Services.AddScoped<ICognitiveProfileService, CognitiveProfileService>();
builder.Services.AddScoped<ICognitiveLoadService, CognitiveLoadService>();
builder.Services.AddScoped<IExplainabilityEngine, ExplainabilityEngine>();
builder.Services.AddScoped<IRecommendationEngine, RecommendationEngine>();
builder.Services.AddScoped<ITaskRepository, EfTaskRepository>();
builder.Services.AddScoped<IPlanningEngine, PlanningEngine>();
builder.Services.AddScoped<IPredictionEngine, PredictionEngine>();

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
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
