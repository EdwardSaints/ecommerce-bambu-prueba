# Dockerfile multi-stage para optimizar el tamaño de la imagen final

# ================================
# Etapa 1: Construcción (Builder)
# ================================
FROM node:20-alpine AS builder

# Instalar dependencias del sistema necesarias para compilar módulos nativos
RUN apk add --no-cache python3 make g++

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias (incluyendo devDependencies para la compilación)
RUN npm ci --only=production=false

# Copiar código fuente
COPY . .

# Generar cliente de Prisma
RUN npx prisma generate

# Compilar la aplicación TypeScript
RUN npm run build

# Limpiar devDependencies para reducir tamaño
RUN npm ci --only=production && npm cache clean --force

# ================================
# Etapa 2: Producción (Runtime)
# ================================
FROM node:20-alpine AS production

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Instalar dumb-init para manejo correcto de señales
RUN apk add --no-cache dumb-init

# Establecer directorio de trabajo
WORKDIR /app

# Cambiar propietario del directorio
RUN chown -R nestjs:nodejs /app
USER nestjs

# Copiar archivos necesarios desde la etapa de construcción
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Crear directorio para logs
RUN mkdir -p logs

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Usar dumb-init como PID 1 para manejo correcto de señales
ENTRYPOINT ["dumb-init", "--"]

# Comando por defecto
CMD ["node", "dist/main.js"]
