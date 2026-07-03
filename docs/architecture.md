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

## Evolução futura

O projeto deve estar pronto para:
- conectar modelos preditivos;
- criar pipelines de dados comportamentais;
- suportar experimentos de IHC e sistemas adaptativos;
- permitir pesquisas em saúde aplicada e produtividade;
- ser ampliado sem reescrever o núcleo.
