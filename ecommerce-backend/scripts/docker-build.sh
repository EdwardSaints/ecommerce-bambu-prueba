#!/bin/bash

# Script para construir y desplegar la aplicación con Docker

set -e

echo "🐳 Iniciando construcción Docker para eCommerce API..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Verificar que Docker está instalado
if ! command -v docker &> /dev/null; then
    error "Docker no está instalado. Por favor instala Docker primero."
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose no está instalado. Por favor instala Docker Compose primero."
fi

# Leer argumentos
ENVIRONMENT=${1:-production}
ACTION=${2:-up}

log "Ambiente: $ENVIRONMENT"
log "Acción: $ACTION"

# Seleccionar archivo de compose
if [ "$ENVIRONMENT" = "development" ] || [ "$ENVIRONMENT" = "dev" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
    ENV_FILE=".env"
else
    COMPOSE_FILE="docker-compose.yml"
    ENV_FILE=".env.docker"
fi

log "Usando archivo: $COMPOSE_FILE"

# Verificar que el archivo de compose existe
if [ ! -f "$COMPOSE_FILE" ]; then
    error "Archivo $COMPOSE_FILE no encontrado"
fi

# Crear archivo .env si no existe
if [ ! -f "$ENV_FILE" ] && [ "$ENVIRONMENT" = "production" ]; then
    warn "Archivo $ENV_FILE no encontrado. Creando uno básico..."
    cat > .env.docker << EOF
POSTGRES_DB=ecommerce_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password_super_seguro_2024
JWT_SECRET=jwt-secret-super-seguro-para-produccion-2024
APP_PORT=3000
NODE_ENV=production
EOF
fi

# Ejecutar acción
case $ACTION in
    "build")
        log "🔨 Construyendo imágenes..."
        docker-compose -f $COMPOSE_FILE build --no-cache
        ;;
    "up")
        log "🚀 Iniciando servicios..."
        docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d
        ;;
    "down")
        log "🛑 Deteniendo servicios..."
        docker-compose -f $COMPOSE_FILE down
        ;;
    "restart")
        log "🔄 Reiniciando servicios..."
        docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE down
        docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d
        ;;
    "logs")
        log "📋 Mostrando logs..."
        docker-compose -f $COMPOSE_FILE logs -f
        ;;
    "clean")
        log "🧹 Limpiando contenedores y volúmenes..."
        docker-compose -f $COMPOSE_FILE down -v
        docker system prune -f
        ;;
    *)
        error "Acción no reconocida: $ACTION. Usa: build, up, down, restart, logs, clean"
        ;;
esac

if [ "$ACTION" = "up" ]; then
    log "✅ Servicios iniciados correctamente!"
    log "📱 API disponible en: http://localhost:${APP_PORT:-3000}"
    log "🗄️  PostgreSQL disponible en: localhost:${POSTGRES_PORT:-5432}"
    log "📊 Para ver logs: ./scripts/docker-build.sh $ENVIRONMENT logs"
    log "🛑 Para detener: ./scripts/docker-build.sh $ENVIRONMENT down"
fi
