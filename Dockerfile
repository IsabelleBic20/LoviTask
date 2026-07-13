FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["src/LoviTask.Api/LoviTask.Api.csproj", "src/LoviTask.Api/"]
COPY ["src/LoviTask.Application/LoviTask.Application.csproj", "src/LoviTask.Application/"]
COPY ["src/LoviTask.Infrastructure/LoviTask.Infrastructure.csproj", "src/LoviTask.Infrastructure/"]
COPY ["src/LoviTask.Domain/LoviTask.Domain.csproj", "src/LoviTask.Domain/"]

RUN dotnet restore "src/LoviTask.Api/LoviTask.Api.csproj"

COPY . .
WORKDIR "/src/src/LoviTask.Api"
RUN dotnet publish "LoviTask.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Instalar curl para healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 5000

# Criar diretório de dados e garantir permissões para o usuário app (UID 1654)
RUN mkdir -p /app/data && chown -R app:app /app/data
VOLUME /app/data

# Executar como usuário não-root
USER app

ENTRYPOINT ["dotnet", "LoviTask.Api.dll"]
