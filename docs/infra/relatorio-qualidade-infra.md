# Relatório de Qualidade de Infraestrutura — LoviTask

**Data:** 10 de Julho de 2026  
**Escopo da Análise:** Arquivos de configuração de container e execução Docker do projeto LoviTask.  
**Arquivos Analisados:**
- [Dockerfile (Root - Backend)](file:///home/isabelle/projects/LoviTask/Dockerfile)
- [Dockerfile (Frontend)](file:///home/isabelle/projects/LoviTask/frontend/Dockerfile)
- [docker-compose.yml](file:///home/isabelle/projects/LoviTask/docker-compose.yml)
- [.dockerignore (Root)](file:///home/isabelle/projects/LoviTask/.dockerignore)
- [.dockerignore (Frontend)](file:///home/isabelle/projects/LoviTask/frontend/.dockerignore)
- [nginx.conf (Frontend)](file:///home/isabelle/projects/LoviTask/frontend/nginx.conf)
- [DOCKER.md](file:///home/isabelle/projects/LoviTask/DOCKER.md)

---

## 1. Resumo Executivo

Após uma análise detalhada da infraestrutura configurada no projeto LoviTask, identificou-se que a base do setup Docker e Docker Compose estava bem estruturada utilizando builds de múltiplos estágios (multi-stage builds), separação clara de rede de bridge, e controle básico de variáveis de ambiente.

No entanto, o projeto apresentava vulnerabilidades e ineficiências importantes em termos de:
- **Segurança**: Os containers de backend rodavam com privilégios de `root` por padrão, não tirando proveito dos usuários não-privilegiados nativos das imagens do .NET 8.
- **Performance**: A ausência do diretório `frontend/` e `node_modules/` no arquivo `.dockerignore` da raiz fazia com que o contexto de build do backend ficasse extremamente pesado, transferindo gigabytes de dependências desnecessárias para a engine do Docker durante o build.
- **Resiliência**: Falta de verificação de saúde (`healthcheck`) do backend no Docker Compose e dependências que não esperavam a real inicialização da API para subir o frontend.
- **Produção**: Falta de um arquivo de configuração voltado para produção com limites de recursos e políticas rígidas de reinicialização, embora isso estivesse previsto na documentação.

**Avaliação Qualitativa Atualizada**: **BOM (Após Implementação das Melhorias)**  
*Nota: As principais otimizações críticas e alertas mapeados abaixo já foram aplicados e corrigidos nos arquivos correspondentes pelo assistente.*

---

## 2. Análise Detalhada por Componente

| Componente | Pontos Fortes | Pontos Fracos (Identificados) | Estado Atual |
| :--- | :--- | :--- | :--- |
| **Dockerfile (Backend)** | Multi-stage build eficiente; restaura dependências do .NET de forma isolada antes do `COPY . .`. | Rodava como `root`; sem ferramentas de diagnóstico/curl integradas para healthcheck no runtime. | **Corrigido**: Configurado usuário `USER app` (não-root) e instalação do `curl` para healthcheck. |
| **Dockerfile (Frontend)** | Multi-stage build correto utilizando Nginx Alpine para servir os assets compilados; possui healthcheck nativo. | Utilizava `npm install` em vez de `npm ci`, comprometendo a reprodutibilidade e performance. | **Corrigido**: Atualizado para `npm ci` com flags de otimização de cache. |
| **docker-compose.yml** | Configuração simples; uso de variáveis de ambiente do `.env`; rede isolada. | Falta de políticas de reinicialização; dependência do frontend no backend baseada apenas no estado do container (não no healthcheck). | **Corrigido**: Adicionado healthcheck no backend, `condition: service_healthy` no frontend e `restart: unless-stopped`. |
| **nginx.conf** | SPA Routing configurado de forma limpa; proxy configurado corretamente para `/api/` e `/swagger/`. | Mencionava suporte à compressão Gzip na documentação, mas a funcionalidade não estava ativa na prática. | **Corrigido**: Inseridas diretivas do módulo Gzip no bloco principal do servidor. |
| **.dockerignore (Root)** | Ignorava binários e builds do .NET (`bin/`, `obj/`). | Não ignorava a pasta `frontend/`, copiando o código da interface e todas as suas `node_modules` para o contexto de build do .NET. | **Corrigido**: Inserido `frontend/`, `node_modules/` e `dist/` no arquivo de ignorados. |

---

## 3. Tabela de Vulnerabilidades e Oportunidades Mapeadas

Abaixo estão detalhados os problemas encontrados e como foram corrigidos no projeto:

### 3.1 Execução de Container do Backend como Root
- **Gravidade:** **[ALERTA]**
- **Impacto potencial:** Se houver uma vulnerabilidade de segurança (RCE - Remote Code Execution) no código ASP.NET Core, um invasor que explorar a falha terá privilégios de superusuário (`root`) dentro do container e, em alguns casos de má configuração da máquina hospedeira, poderá obter acesso ao host (container escape).
- **Correção Aplicada:**
  Utilizou-se o usuário pré-configurado `app` (UID/GID 1654) da imagem oficial do .NET 8, ajustando as permissões da pasta de dados persistentes `/app/data` para evitar erros de permissão de escrita do SQLite.
  ```dockerfile
  # No Dockerfile do Runtime
  RUN mkdir -p /app/data && chown -R app:app /app/data
  VOLUME /app/data
  USER app
  ```

### 3.2 Contexto de Build Bloqueado por Dependências do Frontend
- **Gravidade:** **[OTIMIZAÇÃO]**
- **Impacto potencial:** Lerdeza extrema ao executar `docker compose build`. O Docker copia todo o conteúdo do diretório atual para a engine de build. Como a pasta `frontend/node_modules/` pode conter milhares de arquivos pequenos e centenas de megabytes, o tempo de inicialização do build aumentava significativamente.
- **Correção Aplicada:**
  Adicionada a pasta do frontend e subpastas temporárias ao `.dockerignore` da raiz do projeto.
  ```dockerignore
  frontend/
  node_modules/
  dist/
  ```

### 3.3 Falta de Sincronismo de Inicialização dos Serviços
- **Gravidade:** **[ALERTA]**
- **Impacto potencial:** Ao executar `docker compose up`, o container `lovitask-frontend` inicia instantaneamente e tenta fazer requisições à API. Contudo, o backend .NET leva alguns segundos para subir (compilação do JIT, conexões com banco, migrações de dados). Isso gera falhas de conexão momentâneas no frontend.
- **Correção Aplicada:**
  Adicionado um mecanismo de Health Check no backend via endpoint HTTP `/api/health` e configurada a dependência estrita de saúde no frontend.
  ```yaml
  # Backend
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
    interval: 10s
    timeout: 5s
    retries: 3
    start_period: 10s

  # Frontend
  depends_on:
    web:
      condition: service_healthy
  ```

### 3.4 Compressão Gzip Inativa no Nginx
- **Gravidade:** **[BOA PRÁTICA]**
- **Impacto potencial:** Consumo excessivo de banda de rede e maior latência no carregamento inicial da Single Page Application (SPA), pois os arquivos HTML, JS e CSS são baixados em tamanho real em vez de compactados.
- **Correção Aplicada:**
  Ativadas as diretivas de Gzip no `nginx.conf`:
  ```nginx
  gzip on;
  gzip_vary on;
  gzip_proxied any;
  gzip_comp_level 6;
  gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;
  gzip_min_length 1024;
  ```

---

## 4. Plano de Ação Recomendado (Próximos Passos)

As melhorias essenciais de nível de código e configuração local já foram aplicadas com sucesso. Para manter e evoluir a maturidade de infraestrutura e DevOps, sugere-se implementar as seguintes etapas:

1. **[BOA PRÁTICA] CI/CD Pipeline (GitHub Actions)**:  
   Implementar um workflow automático que compile, execute testes unitários e realize o lint de código a cada push/pull request. (Recomendado para `.github/workflows/ci.yml`).
2. **[SEGURANÇA] Escaneamento de Imagens**:  
   Adicionar uma etapa de segurança para varredura de vulnerabilidades em containers (ex: Trivy, Snyk) no pipeline de CI/CD para detectar imagens base desatualizadas.
3. **[CONFIABILIDADE] Monitoramento e Logging Centralizado**:  
   Caso o sistema cresça e migre para a nuvem, substituir os logs de console padrão por ferramentas como Grafana Loki, Prometheus ou serviços gerenciados de APM (Application Performance Monitoring).
4. **[BOA PRÁTICA] Certificados SSL / HTTPS no Nginx**:  
   Adicionar configuração de suporte a TLS (HTTPS) na porta 443 do Nginx para ambientes fora do localhost, usando certificados gerados via Let's Encrypt / Certbot.
