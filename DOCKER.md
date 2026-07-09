# Docker Setup — LoviTask

## Quickstart

### Rodar tudo (Backend + Frontend)

```bash
docker compose up --build
```

Acesse:
- 🖥️ **Frontend**: `http://localhost`
- 🔧 **API Backend**: `http://localhost:5000`
- 📚 **Swagger Docs**: `http://localhost/swagger`

### Parar

```bash
docker compose down
```

## Arquitetura

### Serviços

| Serviço | Container | Porta | Tecnologia | Função |
|---------|-----------|-------|-----------|--------|
| **web** | lovitask-backend | 5000 | ASP.NET Core 8 | API REST |
| **frontend** | lovitask-frontend | 80 | Node 20 + Nginx | React UI + Proxy |

### Fluxo

```
Browser (localhost)
    ↓
 Nginx (porta 80)
    ├─ Serve arquivos React
    ├─ /api/* → Backend (web:5000)
    └─ /swagger/* → Backend Swagger
```

## Variáveis de Ambiente

Editar `.env`:

```bash
# Backend
APP_ENV=development          # development ou production
APP_PORT=5000                # Porta interna do backend
DB_PATH=/app/data/lovitask.db # Caminho do SQLite
DEBUG_MODE=true              # Logs detalhados

# Frontend
FRONTEND_PORT=80             # Porta externa do nginx
```

## Detalhes dos Containers

### Backend (lovitask-backend)

- **Imagem base**: mcr.microsoft.com/dotnet/aspnet:8.0
- **Build**: Multi-stage (SDK + Runtime)
- **Volume**: `lovitask-data:/app/data` (banco de dados persistente)
- **Health Check**: Verifica `/swagger` a cada 10s

### Frontend (lovitask-frontend)

- **Build**: Node 20 Alpine
  - Stage 1: Instala dependências e faz build com Vite
  - Stage 2: Serve com Nginx Alpine
- **Nginx**: Configurado com proxy reverso para API
  - SPA routing automático
  - Cache de assets estáticos
  - Compressão Gzip

## Troubleshooting

### Porta já em uso

```bash
# Verificar qual processo usa a porta
lsof -i :80      # Frontend
lsof -i :5000    # Backend

# Customizar porta
nano .env
# Alterar APP_PORT ou FRONTEND_PORT
docker compose up --build
```

### Banco de dados corrompido

```bash
# Remover volume
docker compose down -v

# Reconstruir
docker compose up --build
```

### Logs

```bash
# Todos os serviços
docker compose logs -f

# Apenas backend
docker compose logs -f web

# Apenas frontend
docker compose logs -f frontend
```

### Acessar container bash

```bash
# Backend
docker exec -it lovitask-backend bash

# Frontend
docker exec -it lovitask-frontend sh
```

## Desenvolvimento

### Sem Docker (local)

```bash
# Terminal 1: Backend
cd /home/isabelle/projects/LoviTask
dotnet run --project src/LoviTask.Api/LoviTask.Api.csproj

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

## Produção

Para build otimizado:

```bash
docker compose -f docker-compose.prod.yml up --build
```

(Ainda não existe `docker-compose.prod.yml` )
