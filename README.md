# LoviTask

## Principal Diferencial — Assistente Cognitivo Adaptativo

Este projeto apresenta um módulo central chamado **Assistente Cognitivo Adaptativo**, responsável por construir um **Perfil Cognitivo Individual** e adaptar a experiência de forma personalizada.

### Objetivo

O Assistente Cognitivo Adaptativo vai além da gestão de tarefas:
- aprende continuamente como o usuário funciona;
- identifica padrões de comportamento;
- personaliza recomendações sem linguagem acolhedora e eficaz;
- reduz sobrecarga mental;
- incentiva pequenas vitórias;
- prepara o sistema para evolução futura com Machine Learning.

## Arquitetura do Projeto

O projeto é dividido em camadas:
- `Api`: interface HTTP, Swagger e orquestração.
- `Application`: lógica de personalização e regras de negócio.
- `Domain`: entidades, modelos e contratos centrais.
- `Infrastructure`: provedores de armazenamento, IA e repositórios.

## Documentação da API

A API está documentada via Swagger.
- rota de documentação: `/swagger`
- versão: `v1`
- título: `LoviTask API`
- descrição: `API para personalização cognitiva, métricas de produtividade e Brain Dump inteligente com metas e prazos.`

### Endpoints principais

#### Brain Dump
- `POST /api/BrainDump/analyze`
- request body:
  - `Text` (string) — texto do Brain Dump
  - `Goal` (string, opcional) — meta vinculada ao Brain Dump
  - `Deadline` (DateTime, opcional) — prazo para conclusão
- resposta: lista de `MicrotaskSuggestion` com `Title`, `Description` e `Priority`

#### Personalização
- `POST /api/Personalization/events` — grava eventos de atividade do usuário
- `GET /api/Personalization/profile` — consulta o perfil cognitivo do usuário
- `GET /api/Personalization/recommendations` — obtém recomendações personalizadas

#### Métricas e eventos
- `GET /api/Metrics` — retorna métricas de produtividade e procrastinação
- `GET /api/Events` — lista eventos registrados

## Uso

### Pré-requisitos

- .NET 8 SDK
- SQLite (usado localmente pelo projeto)

### Executar localmente

```bash
cd /home/isabelle/projects/LoviTask
dotnet run --project src/LoviTask.Api/LoviTask.Api.csproj
```

### Testes

```bash
dotnet test src/LoviTask.Tests/LoviTask.Tests.csproj --no-restore
```

## Evolução atual

Esse projeto já suporta:
- análise de Brain Dump com microtarefas inteligentes;
- prioridade dinâmica baseada em urgência, prazo e objetivos;
- persistência via SQLite;
- geração de perfil cognitivo e métricas personalizadas;
- documentação Swagger com comentários XML.

## Próximos passos

1. Integrar mais fontes de eventos do usuário.
2. Criar dashboards de comportamento em tempo real.
3. Adicionar recursos de aprendizado incremental e recomendação preditiva.
4. Implementar autenticação e múltiplos usuários.

## Execução em Docker

### Pré-requisitos

- Docker
- Docker Compose

### Como usar

```bash
cd /home/isabelle/projects/LoviTask
docker compose up --build
```

O serviço será exposto em `http://localhost:5000`.

### Variáveis de ambiente e .env

O `docker-compose.yml` usa o arquivo `.env` para definir:
- `ASPNETCORE_ENVIRONMENT=Development`
- `LOVITASK_DATABASE_PATH=/app/data/lovitask.db`

### Alternativa sem Compose

```bash
docker build -t lovitask-api .
docker run -p 5000:5000 -e ASPNETCORE_ENVIRONMENT=Development -e LOVITASK_DATABASE_PATH=/app/data/lovitask.db -v "$PWD/data:/app/data" lovitask-api
```

A documentação Swagger ficará disponível em `http://localhost:5000/swagger`.
