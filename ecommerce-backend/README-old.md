# eCommerce API - Backend

API RESTful completa para eCommerce desarrollada con Node.js, TypeScript, NestJS y PostgreSQL.

## Características

- **Autenticación JWT** completa con roles
- **Gestión de productos** con sincronización automática desde DummyJSON
- **Carrito de compras** con validación de stock
- **Categorías** dinámicas
- **Cron Jobs** para sincronización automática
- **Logging** centralizado con Winston
- **Rate Limiting** y seguridad
- **Documentación Swagger** automática
- **Dockerización** completa
- **Health Checks** y monitoreo

## Stack Tecnológico

- **Backend**: Node.js 20 + TypeScript + NestJS
- **Base de datos**: PostgreSQL 15
- **ORM**: Prisma
- **Autenticación**: JWT + Passport
- **Cache**: Redis (opcional)
- **Proxy**: Nginx
- **Containerización**: Docker + Docker Compose
- **Logging**: Winston
- **Validación**: class-validator
- **Documentación**: Swagger/OpenAPI

## Arquitectura y Decisiones Técnicas

### **Arquitectura General**

El proyecto sigue una **arquitectura modular en capas** con separación clara de responsabilidades:

```
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Controllers)                 │
├─────────────────────────────────────────────────────────────┤
│                    Security Layer (Guards/Middleware)      │
├─────────────────────────────────────────────────────────────┤
│                    Business Logic (Services)               │
├─────────────────────────────────────────────────────────────┤
│                    Data Access Layer (Prisma ORM)          │
├─────────────────────────────────────────────────────────────┤
│                    Database (PostgreSQL)                   │
└─────────────────────────────────────────────────────────────┘
```

### **Principios de Diseño Aplicados**

#### **1. SOLID Principles**
- **Single Responsibility**: Cada servicio tiene una responsabilidad específica
- **Open/Closed**: Extensible mediante módulos sin modificar código existente
- **Liskov Substitution**: Interfaces bien definidas para servicios
- **Interface Segregation**: DTOs específicos para cada operación
- **Dependency Inversion**: Inyección de dependencias con NestJS

#### **2. Clean Architecture**
- **Separación de capas**: Presentación, lógica de negocio, acceso a datos
- **Independencia de frameworks**: Lógica de negocio independiente de NestJS
- **Testabilidad**: Cada capa es testeable de forma aislada

#### **3. Domain-Driven Design (DDD)**
- **Módulos por dominio**: Auth, Products, Cart, Users, etc.
- **Entidades bien definidas**: User, Product, Cart, Order
- **Servicios de dominio**: Lógica de negocio encapsulada

### 🏛️ **Estructura Modular**

```
src/
├── 🔐 auth/           # Autenticación y autorización
├── 👥 users/          # Gestión de usuarios
├── 📦 products/       # Catálogo de productos
├── 🛒 cart/           # Carrito de compras
├── 🏷️ categories/     # Categorías de productos
├── ⏰ tasks/          # Cron jobs y tareas programadas
├── 🌐 external/       # Integraciones externas (DummyJSON)
└── 🔧 common/         # Utilidades compartidas
    ├── guards/        # Guardias de seguridad
    ├── decorators/    # Decoradores personalizados
    ├── dto/           # Data Transfer Objects
    ├── interfaces/    # Interfaces TypeScript
    ├── logger/        # Sistema de logging
    └── prisma/        # Cliente de base de datos
```

### 🔧 **Decisiones Técnicas Clave**

#### **1. ¿Por qué NestJS?**
- ✅ **Arquitectura escalable** con decoradores y módulos
- ✅ **TypeScript nativo** con tipado fuerte
- ✅ **Inyección de dependencias** integrada
- ✅ **Ecosistema maduro** con guards, pipes, interceptors
- ✅ **Documentación automática** con Swagger
- ✅ **Testing integrado** con Jest

#### **2. ¿Por qué Prisma ORM?**
- ✅ **Type-safe** queries con autocompletado
- ✅ **Migraciones automáticas** y versionado de esquema
- ✅ **Prisma Studio** para visualización de datos
- ✅ **Generación automática** de tipos TypeScript
- ✅ **Múltiples bases de datos** soportadas
- ✅ **Performance optimizada** con query engine

#### **3. ¿Por qué PostgreSQL?**
- ✅ **ACID compliance** para transacciones seguras
- ✅ **JSON support** para datos semi-estructurados
- ✅ **Escalabilidad horizontal** y vertical
- ✅ **Índices avanzados** (B-tree, GIN, GiST)
- ✅ **Open source** sin costos de licencia
- ✅ **Ecosistema maduro** con herramientas

#### **4. ¿Por qué JWT + Passport?**
- ✅ **Stateless authentication** escalable
- ✅ **Estándar de la industria** (RFC 7519)
- ✅ **Múltiples estrategias** (Local, JWT, OAuth)
- ✅ **Payload personalizable** con roles y permisos
- ✅ **Expiración automática** de tokens

#### **5. ¿Por qué Docker?**
- ✅ **Consistencia** entre desarrollo y producción
- ✅ **Aislamiento** de dependencias
- ✅ **Escalabilidad** con orquestadores
- ✅ **CI/CD** simplificado
- ✅ **Multi-stage builds** para optimización

### 🔒 **Arquitectura de Seguridad**

```
🌐 Request
    ↓
🚦 Rate Limiting (ThrottlerGuard)
    ↓
🔍 Validation (ValidationPipe)
    ↓
🛡️ Authentication (JwtAuthGuard)
    ↓
👮 Authorization (RolesGuard)
    ↓
💼 Business Logic (Services)
    ↓
📊 Logging (LoggerService)
    ↓
🗄️ Database (Prisma)
```

#### **Capas de Seguridad:**
1. **Rate Limiting**: Previene ataques de fuerza bruta
2. **Input Validation**: Sanitización y validación de datos
3. **Authentication**: Verificación de identidad con JWT
4. **Authorization**: Control de acceso basado en roles
5. **SQL Injection Prevention**: Queries parametrizadas con Prisma
6. **CORS**: Configuración de orígenes permitidos
7. **Helmet**: Headers de seguridad HTTP

### 📊 **Patrones de Diseño Implementados**

#### **1. Repository Pattern**
```typescript
// Abstracción del acceso a datos
class ProductsService {
  constructor(private prisma: PrismaService) {}
  
  async findAll(filters: ProductQueryDto) {
    return this.prisma.product.findMany({...});
  }
}
```

#### **2. Strategy Pattern**
```typescript
// Múltiples estrategias de autenticación
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {}

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {}
```

#### **3. Decorator Pattern**
```typescript
// Decoradores para funcionalidad transversal
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class ProductsController {}
```

#### **4. Factory Pattern**
```typescript
// Creación de objetos complejos
export class AuthResponseDto {
  static create(user: User, tokens: TokenPair): AuthResponseDto {
    return { user: UserResponseDto.fromUser(user), ...tokens };
  }
}
```

#### **5. Observer Pattern**
```typescript
// Cron jobs como observadores de tiempo
@Cron(CronExpression.EVERY_12_HOURS)
async handleProductSync() {
  await this.productsService.syncProductsFromDummyJSON();
}
```

### 🔄 **Flujo de Datos**

#### **Sincronización de Productos:**
```
⏰ Cron Job (cada 12h)
    ↓
🌐 DummyJSON API
    ↓
🔄 ProductsService.sync()
    ↓
🏷️ CategoriesService.upsert()
    ↓
📦 ProductsService.upsert()
    ↓
📊 SystemLog.create()
```

#### **Flujo de Carrito:**
```
👤 User Request
    ↓
🛡️ JWT Validation
    ↓
🛒 CartService
    ↓
📦 Product Stock Check
    ↓
💾 Database Transaction
    ↓
📊 Response with Updated Cart
```

### 🧪 **Estrategia de Testing**

#### **Pirámide de Testing:**
```
        🔺 E2E Tests (Integration)
       🔺🔺 Integration Tests  
    🔺🔺🔺🔺 Unit Tests (Base)
```

- **Unit Tests**: Servicios aislados con mocks
- **Integration Tests**: Controladores con base de datos de prueba
- **E2E Tests**: Flujos completos de usuario

### 📈 **Escalabilidad y Performance**

#### **Optimizaciones Implementadas:**
- ✅ **Paginación** en todas las consultas de listado
- ✅ **Índices de base de datos** en campos de búsqueda
- ✅ **Lazy loading** de relaciones
- ✅ **Connection pooling** con Prisma
- ✅ **Caching** de productos sincronizados
- ✅ **Rate limiting** para prevenir abuso

#### **Preparado para Escalar:**
- 🔄 **Horizontal scaling** con Docker Swarm/Kubernetes
- 📊 **Load balancing** con Nginx
- 💾 **Database replication** (master-slave)
- 🚀 **CDN** para assets estáticos
- 📈 **Monitoring** con logs estructurados

### 🔍 **Observabilidad**

#### **Logging Estructurado:**
```typescript
this.loggerService.log('User registered', 'AuthService', {
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString()
});
```

#### **Métricas Disponibles:**
- 📊 Requests por endpoint
- ⏱️ Tiempo de respuesta
- 🚨 Errores por tipo
- 👥 Usuarios activos
- 📦 Productos sincronizados

### 🚀 **Roadmap Técnico**

#### **Próximas Mejoras:**
- 🔄 **Redis caching** para productos frecuentes
- 📊 **Elasticsearch** para búsqueda avanzada
- 🔔 **WebSockets** para notificaciones en tiempo real
- 📱 **GraphQL** como alternativa a REST
- 🧪 **Mutation testing** para calidad de tests
- 📈 **APM** (Application Performance Monitoring)

## 🐳 Despliegue con Docker (Recomendado)

### Prerrequisitos

- Docker 20.10+
- Docker Compose 2.0+

### 🚀 Inicio Rápido

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd ecommerce-backend
   ```

2. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.docker
   # Editar .env.docker con tus configuraciones
   ```

3. **Iniciar todos los servicios**
   ```bash
   # Usando el script helper
   ./scripts/docker-build.sh production up
   
   # O directamente con docker-compose
   docker-compose --env-file .env.docker up -d
   ```

4. **Verificar que todo funciona**
   ```bash
   curl http://localhost:3000
   ```

### 🔧 Comandos Útiles

```bash
# Construir imágenes
./scripts/docker-build.sh production build

# Iniciar servicios
./scripts/docker-build.sh production up

# Ver logs
./scripts/docker-build.sh production logs

# Reiniciar servicios
./scripts/docker-build.sh production restart

# Detener servicios
./scripts/docker-build.sh production down

# Limpiar todo (contenedores + volúmenes)
./scripts/docker-build.sh production clean
```

### 🧪 Desarrollo con Docker

```bash
# Iniciar en modo desarrollo
./scripts/docker-build.sh development up

# La aplicación se recarga automáticamente con los cambios
```

## 💻 Desarrollo Local (Sin Docker)

### Prerrequisitos

- Node.js 20+
- PostgreSQL 15+
- npm o yarn

### Instalación

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Configurar base de datos**
   ```bash
   # Crear archivo .env
   cp .env.example .env
   
   # Configurar DATABASE_URL en .env
   DATABASE_URL="postgresql://usuario:password@localhost:5432/ecommerce_db"
   ```

3. **Ejecutar migraciones**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Iniciar en desarrollo**
   ```bash
   npm run start:dev
   ```

## 📊 Servicios y Puertos

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| API | 3000 | Aplicación principal |
| PostgreSQL | 5432 | Base de datos |
| Redis | 6379 | Cache (opcional) |
| Nginx | 80/443 | Reverse proxy |

## 🔐 Autenticación

### Registrar usuario
```bash
POST /auth/register
{
  "email": "usuario@ejemplo.com",
  "password": "password123",
  "firstName": "Juan",
  "lastName": "Pérez"
}
```

### Iniciar sesión
```bash
POST /auth/login
{
  "email": "usuario@ejemplo.com",
  "password": "password123"
}
```

### Usar token
```bash
Authorization: Bearer <tu-jwt-token>
```

## 🛒 Endpoints Principales

### Productos
- `GET /products` - Listar productos con filtros
- `GET /products/:id` - Obtener producto específico
- `POST /products/sync` - Sincronizar desde DummyJSON (admin)

### Categorías
- `GET /categories` - Listar categorías
- `GET /categories/:slug` - Obtener categoría por slug

### Carrito
- `GET /cart` - Ver carrito
- `POST /cart/items` - Agregar producto
- `PUT /cart/items/:id` - Actualizar cantidad
- `DELETE /cart/items/:id` - Eliminar producto
- `DELETE /cart` - Limpiar carrito

### Tareas Programadas
- `GET /tasks/status` - Estado de cron jobs (admin)
- `POST /tasks/sync-products` - Sincronización manual (admin)

## 📚 Documentación API

Una vez iniciada la aplicación, la documentación Swagger está disponible en:
- **Swagger UI**: http://localhost:3000/api
- **JSON Schema**: http://localhost:3000/api-json

## ⏰ Cron Jobs

- **Sincronización de productos**: Cada 12 horas (00:00 y 12:00)
- **Limpieza de logs**: Domingos a las 2:00 AM

## 🔒 Seguridad

- ✅ Rate limiting por IP
- ✅ Validación de datos con DTOs
- ✅ Sanitización de inputs
- ✅ Headers de seguridad
- ✅ CORS configurado
- ✅ Passwords hasheados con bcrypt
- ✅ JWT con expiración

## 📝 Logging

Los logs se almacenan en:
- **Desarrollo**: Consola + archivos en `./logs/`
- **Producción**: Archivos rotativos por fecha
- **Docker**: Volúmenes persistentes

Niveles de log: `error`, `warn`, `info`, `debug`

## 📈 Diagrama ER

El proyecto incluye un diagrama ER completo de la base de datos:

### 📊 **Visualización del Esquema**

1. **Diagrama SVG Generado**: `docs/ER-Diagram.svg`
   - Generado automáticamente con `prisma-erd-generator`
   - Muestra todas las relaciones entre entidades
   - Actualizado automáticamente con `npx prisma generate`

2. **Documentación Detallada**: `docs/database-schema.md`
   - Diagrama en formato Mermaid
   - Descripción completa de cada entidad
   - Explicación de relaciones y constraints

3. **Arquitectura Técnica**: `docs/architecture.md`
   - Patrones de diseño implementados
   - Decisiones técnicas justificadas
   - Flujos de datos detallados
   - Estrategias de escalabilidad

4. **Prisma Studio** (Interfaz Visual):
   ```bash
   npx prisma studio
   ```
   - Interfaz web en `http://localhost:5555`
   - Exploración interactiva de datos
   - Visualización de relaciones en tiempo real

### 🔗 **Entidades Principales**
- **User** → Usuarios del sistema (CUSTOMER/ADMIN)
- **Category** → Categorías de productos
- **Product** → Productos sincronizados con DummyJSON
- **Cart/CartItem** → Carrito de compras
- **Order/OrderItem** → Órdenes completadas
- **SystemLog** → Logs centralizados del sistema

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Coverage
npm run test:cov
```

## 🚀 Despliegue en Producción

### Con Docker (Recomendado)

1. **Configurar variables de entorno de producción**
2. **Usar HTTPS con certificados SSL**
3. **Configurar backup de base de datos**
4. **Monitoreo con logs centralizados**

### Variables de Entorno Importantes

```bash
# Seguridad
JWT_SECRET=tu-secret-super-seguro-de-produccion
POSTGRES_PASSWORD=password-super-seguro

# Performance
NODE_ENV=production
LOG_LEVEL=warn

# Rate Limiting
THROTTLE_LIMIT=10
THROTTLE_TTL=60
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

- **Issues**: [GitHub Issues](https://github.com/tu-usuario/ecommerce-backend/issues)
- **Documentación**: [Wiki](https://github.com/tu-usuario/ecommerce-backend/wiki)
- **Email**: soporte@tuempresa.com

---

**Desarrollado con ❤️ usando NestJS y TypeScript**