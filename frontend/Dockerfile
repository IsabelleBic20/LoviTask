# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package.json package-lock.json* ./

# Instalar dependências de forma limpa e otimizada
RUN npm ci --prefer-offline --no-audit --no-fund

# Copiar código-fonte
COPY . .

# Build com Vite
RUN npm run build

# Runtime stage - nginx
FROM nginx:alpine

# Copiar configuração nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build do frontend
COPY --from=builder /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
