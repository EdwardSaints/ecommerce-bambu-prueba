# 🛒 **eCommerce Bambu - Prueba Técnica**

Aplicación completa de eCommerce desarrollada con **NestJS** (backend) y **Angular 19** (frontend).

## 📁 **Estructura del Proyecto**

```
PruebaBambu/
├── ecommerce-backend/     # API RESTful con NestJS + PostgreSQL + Prisma
└── ecommerce-frontend/    # Aplicación web con Angular 19 + Firebase
```

## 🚀 **Tecnologías Utilizadas**

### **Backend**
- **NestJS** - Framework Node.js
- **TypeScript** - Lenguaje de programación
- **PostgreSQL** - Base de datos relacional
- **Prisma ORM** - Object-Relational Mapping
- **JWT** - Autenticación
- **Docker** - Containerización
- **Swagger** - Documentación API
- **Jest** - Testing

### **Frontend**
- **Angular 19** - Framework frontend
- **TypeScript** - Lenguaje de programación
- **Tailwind CSS** - Framework de estilos
- **PrimeNG** - Componentes UI
- **Firebase Auth** - Autenticación
- **Firebase Firestore** - Base de datos NoSQL
- **RxJS** - Programación reactiva

## 🎯 **Funcionalidades Implementadas**

### **✅ Completadas**
- 🔐 **Autenticación completa** (registro, login, logout)
- 👥 **Gestión de usuarios** con roles
- 📦 **Catálogo de productos** desde DummyJSON API
- 🔍 **Búsqueda y filtros** de productos
- 🛡️ **Rutas protegidas** con guards
- 📱 **Diseño responsive** con Tailwind CSS
- 🔔 **Sistema de notificaciones**
- 📊 **Documentación completa** con Swagger
- 🧪 **Testing** unitario e integración
- 🐳 **Dockerización** completa

### **🚧 En Desarrollo**
- 🛒 **Carrito de compras** con Firestore
- 📄 **Página de detalle** de productos
- 🚀 **Deployment** en Firebase Hosting

## 🛠️ **Instalación y Ejecución**

### **Backend**
```bash
cd ecommerce-backend
npm install
npm run db:dev:restart  # Configurar PostgreSQL con Docker
npm run start:dev
```

### **Frontend**
```bash
cd ecommerce-frontend
npm install
ng serve
```

## 📚 **Documentación**

- **Backend API**: `http://localhost:3000/api/docs` (Swagger)
- **Diagrama ER**: `ecommerce-backend/docs/ER-Diagram.svg`
- **Arquitectura**: `ecommerce-backend/docs/architecture.md`

## 🔗 **URLs de la Aplicación**

- **Frontend**: `http://localhost:4200`
- **Backend API**: `http://localhost:3000`
- **Swagger Docs**: `http://localhost:3000/api/docs`
- **Prisma Studio**: `http://localhost:5555`

## 👨‍💻 **Desarrollado por**

**Eduardo Santos** - Prueba técnica para Bambu Mobile

---

## 📝 **Notas de Desarrollo**

Este proyecto fue desarrollado como prueba técnica, implementando las mejores prácticas de desarrollo:

- **Arquitectura limpia** y modular
- **Principios SOLID**
- **Manejo de errores** robusto
- **Logging** centralizado
- **Testing** comprehensivo
- **Documentación** detallada
- **Seguridad** implementada (JWT, validaciones, sanitización)

### **Firebase Configuration**
Para usar Firebase real, actualizar las credenciales en:
- `ecommerce-frontend/src/environments/environment.ts`
- Cambiar `useFirebaseEmulator: false`
