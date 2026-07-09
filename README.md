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

## Frontend

O frontend é uma aplicação React + TypeScript + Vite localizada em `frontend/`.

### Setup

```bash
cd frontend
npm install
cp .env.example .env
```

### Desenvolvimento

```bash
npm run dev
```

Frontend estará disponível em `http://localhost:3000` e conecta à API em `http://localhost:5000`.

### Build

```bash
npm run build
```

A aplicação inclui:
- **Brain Dump** — análise inteligente de pensamentos e geração de microtarefas
- **Métricas** — visualização de produtividade e procrastinação
- **Perfil Cognitivo** — compreensão de padrões e recomendações personalizadas

## Execução em Docker

### Pré-requisitos

- Docker
- Docker Compose

### Docker Compose (Backend + Frontend)

Executa backend (API) e frontend (React + Nginx) simultaneamente:

```bash
cd /home/isabelle/projects/LoviTask
docker compose up --build
```

**Acesso:**
- Frontend: `http://localhost` (porta 80)
- API Backend: `http://localhost:5000`
- Swagger: `http://localhost/swagger`

O frontend funciona com nginx, que:
- Serve os arquivos estáticos (React build)
- Faz proxy automático das chamadas `/api/*` para o backend
- Suporta SPA routing (qualquer rota desconhecida volta para `index.html`)

### Variáveis de ambiente (.env)

```
# Backend
APP_ENV=development
APP_PORT=5000
DB_PATH=/app/data/lovitask.db
DEBUG_MODE=true

# Frontend
FRONTEND_PORT=80
```

### Backend apenas (sem Docker Compose)

```bash
docker build -t lovitask-api .
docker run -p 5000:5000 \
  -e APP_ENV=development \
  -e DB_PATH=/app/data/lovitask.db \
  -v "$PWD/data:/app/data" \
  lovitask-api
```

### Parar serviços

```bash
docker compose down
```

### Remover tudo (incluindo volumes)

```bash
docker compose down -v
```
