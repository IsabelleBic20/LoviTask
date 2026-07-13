# Arquitetura do Assistente Cognitivo Adaptativo

## Visão Geral

O núcleo do sistema é o **Personalization Engine**, um módulo independente que:
- recebe eventos do sistema;
- registra padrões de uso;
- constrói o Perfil Cognitivo;
- gera recomendações personalizadas;
- fornece contexto para IA de Brain Dumps;
- adapta dashboards, tarefas e notificações.

O módulo deve ser modular e extensível para permitir substituição futura por mecanismos de recomendação mais avançados.

## Domínios principais

### Perfil Cognitivo
Responsável por apresentar informações positivas e acolhedoras:
- horários de maior e menor produtividade;
- melhores períodos para estudo e organização;
- frequência de procrastinação;
- tempo médio de conclusão;
- evolução de hábitos;
- padrões de energia e humor;
- recomendações personalizadas.

### Motor de Personalização
O motor deve:
- coletar eventos do usuário e da aplicação;
- detectar padrões de procrastinação, abandono, conclusão e energia;
- criar recomendações automáticas;
- adaptar prioridades e carga de trabalho;
- apoiar experimentos futuros de IA e ML.

### Inteligência Artificial
A IA deve suportar funcionalidades como:
- interpretação de Brain Dumps;
- identificação de prioridades;
- sugestão de microtarefas;
- reorganização baseada em energia e humor;
- aprendizado incremental com privacidade.

## Camadas

- `Api`: interface HTTP e orquestração.
- `Application`: lógica de personalização e regras de negócio.
- `Domain`: entidades e contratos do núcleo cognitivo.
- `Infrastructure`: provedores de IA, repositórios e integrações.

## Documentação da API

O projeto expõe documentação Swagger ativa na API ASP.NET Core:
- rota padrão: `/swagger`
- versão: `v1`
- título: `LoviTask API`
- descrição: `API para personalização cognitiva, métricas de produtividade e Brain Dump inteligente com metas e prazos.`

A documentação usa comentários XML gerados em build, permitindo:
- descrições de endpoints;
- exemplos de request/response via Swagger UI;
- contrato tipado para `BrainDumpRequest`.

### Endpoint Brain Dump

- `POST /api/BrainDump/analyze`
- corpo de requisição:
  - `Text` (string): texto livre do Brain Dump
  - `Goal` (string, opcional): objetivo relacionado ao Brain Dump
  - `Deadline` (DateTime, opcional): data limite para conclusão
- resposta: array de `MicrotaskSuggestion` com campos:
  - `Title`
  - `Description`
  - `Priority`

Este endpoint gera microtarefas inteligentes com prioridades dinâmicas baseadas em:
- palavras-chave urgentes;
- contexto de meta;
- prazo próximo ou vencido;
- intenção de agendamento futuro.

### Outros endpoints relevantes

- `POST /api/Personalization/events`
  - recebe `UserActivityEvent` e registra comportamento do usuário.
- `GET /api/Personalization/profile`
  - retorna `CognitiveProfile` com jornada cognitiva, padrões e recomendações.
- `GET /api/Personalization/recommendations`
  - retorna recomendações personalizadas de foco, energia e gestão de tarefas.
- `GET /api/Metrics`
  - retorna `PersonalizationMetrics` com taxa de procrastinação, tempo médio de conclusão e categorias mais frequentes.
- `GET /api/Events`
  - lista os eventos de atividade registrados.

## Evolução futura

O projeto deve estar pronto para:
- conectar modelos preditivos;
- criar pipelines de dados comportamentais;
- suportar experimentos de IHC e sistemas adaptativos;
- permitir pesquisas em saúde aplicada e produtividade;
- ser ampliado sem reescrever o núcleo.
