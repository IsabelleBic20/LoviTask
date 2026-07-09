# LoviTask Frontend

React + TypeScript + Vite para a interface do Assistente Cognitivo Adaptativo.

## Setup

```bash
cd frontend
npm install
cp .env.example .env
```

## Desenvolvimento

```bash
npm run dev
```

Abre em `http://localhost:3000`.

## Build

```bash
npm run build
```

## Lint e Format

```bash
npm run lint
npm run lint:fix
npm run format
```

## Arquitetura

- `src/components/` — Componentes React (BrainDump, Metrics, Profile)
- `src/services/` — Serviço de API para backend LoviTask
- `src/types/` — TypeScript types para dados do backend
- `vite.config.ts` — Proxy para API em desenvolvimento

## Variáveis de Ambiente

Ver `.env.example`.
