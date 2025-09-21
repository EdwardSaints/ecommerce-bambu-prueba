# 📚 Documentación del Proyecto eCommerce API

## 📋 Índice de Documentación

### 🗂️ **Documentación Técnica**
- **[architecture.md](./architecture.md)** - Arquitectura detallada y decisiones técnicas
- **[database-schema.md](./database-schema.md)** - Diagrama ER completo con explicaciones
- **[ER-Diagram.svg](./ER-Diagram.svg)** - Diagrama visual generado automáticamente

### 🔧 **Comandos Útiles**

```bash
# Generar diagrama ER actualizado
npm run docs:er

# Abrir Prisma Studio para explorar la BD
npm run db:studio

# Regenerar cliente Prisma
npm run db:generate
```

### 📊 **Estructura de la Base de Datos**

El sistema utiliza **8 entidades principales**:

1. **👤 User** - Gestión de usuarios (clientes y administradores)
2. **🏷️ Category** - Categorización de productos
3. **📦 Product** - Catálogo de productos (sincronizado con DummyJSON)
4. **🛒 Cart** - Carritos de compra de usuarios
5. **🛍️ CartItem** - Items individuales en los carritos
6. **📋 Order** - Órdenes de compra completadas
7. **📦 OrderItem** - Items individuales en las órdenes
8. **📊 SystemLog** - Registro de eventos del sistema

### 🔗 **Relaciones Clave**

- **Usuario ↔ Carrito**: Relación 1:1
- **Usuario ↔ Órdenes**: Relación 1:N
- **Categoría ↔ Productos**: Relación 1:N
- **Producto ↔ Items**: Relación 1:N (tanto carrito como órdenes)

### 🎯 **Características Técnicas**

- **ORM**: Prisma con PostgreSQL
- **Generación Automática**: Diagramas ER actualizados con cada cambio
- **Constraints**: Claves únicas, foreign keys, validaciones
- **Optimización**: Índices en campos de búsqueda frecuente
- **Soft Deletes**: Campo `isActive` para eliminación lógica

### 📈 **Mantenimiento**

El diagrama ER se actualiza automáticamente cuando:
- Ejecutas `npx prisma generate`
- Ejecutas `npm run docs:er`
- Realizas cambios en `prisma/schema.prisma`

### 🔍 **Exploración Visual**

Para explorar la base de datos visualmente:

1. **Prisma Studio**: `npm run db:studio`
2. **Diagrama SVG**: Abrir `docs/ER-Diagram.svg` en el navegador
3. **Documentación Mermaid**: Ver `docs/database-schema.md` en GitHub/GitLab

---

*Documentación generada automáticamente para el proyecto eCommerce API*
