# 🚀 Guía de Deployment - eCommerce Frontend

## 📋 **Índice**

- [Prerrequisitos](#-prerrequisitos)
- [Configuración Inicial](#-configuración-inicial)
- [Deployment Local](#-deployment-local)
- [Deployment a Firebase Hosting](#-deployment-a-firebase-hosting)
- [Configuración de Dominio Personalizado](#-configuración-de-dominio-personalizado)
- [CI/CD con GitHub Actions](#-cicd-con-github-actions)
- [Monitoreo y Analytics](#-monitoreo-y-analytics)
- [Troubleshooting](#-troubleshooting)

## ✅ **Prerrequisitos**

### **Herramientas Necesarias**
- Node.js v18+ 
- npm v9+
- Angular CLI v19
- Firebase CLI
- Git

### **Cuentas Requeridas**
- Cuenta de Firebase/Google Cloud
- Cuenta de GitHub (para CI/CD)
- Dominio personalizado (opcional)

## 🔧 **Configuración Inicial**

### **1. Instalar Firebase CLI**
```bash
npm install -g firebase-tools
```

### **2. Autenticarse con Firebase**
```bash
firebase login
```

### **3. Verificar Proyecto**
```bash
firebase projects:list
```

## 💻 **Deployment Local**

### **Desarrollo**
```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
ng serve --open

# La app estará disponible en http://localhost:4200
```

### **Build Local**
```bash
# Build de desarrollo
ng build

# Build de producción
ng build --configuration production

# Servir build localmente
firebase serve --only hosting
```

## 🌐 **Deployment a Firebase Hosting**

### **Paso 1: Configurar Firebase Hosting**

Si no tienes `firebase.json`, inicializa:
```bash
firebase init hosting
```

Configuración recomendada:
```json
{
  "hosting": {
    "public": "dist/ecommerce-frontend/browser",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### **Paso 2: Build y Deploy**

#### **Deploy Manual**
```bash
# Build de producción
npm run build

# Deploy a Firebase
firebase deploy --only hosting

# Deploy con mensaje personalizado
firebase deploy --only hosting -m "Release v1.2.3"
```

#### **Deploy con un Solo Comando**
```bash
# Crear script en package.json
"scripts": {
  "deploy": "ng build --configuration production && firebase deploy --only hosting"
}

# Ejecutar
npm run deploy
```

### **Paso 3: Verificar Deployment**

Después del deploy exitoso, verás:
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/tu-proyecto/overview
Hosting URL: https://tu-proyecto.web.app
```

## 🏷 **Configuración de Dominio Personalizado**

### **1. Agregar Dominio en Firebase Console**

1. Ve a **Hosting** en Firebase Console
2. Clic en **Add custom domain**
3. Ingresa tu dominio (ej: `mitienda.com`)
4. Sigue las instrucciones de verificación

### **2. Configurar DNS**

Agrega estos registros DNS:
```
Type: A
Name: @
Value: 151.101.1.195

Type: A  
Name: @
Value: 151.101.65.195

Type: CNAME
Name: www
Value: tu-proyecto.web.app
```

### **3. Verificar SSL**

Firebase automáticamente provisiona certificados SSL. Espera 24-48 horas para propagación completa.

## 🔄 **CI/CD con GitHub Actions**

### **Configurar GitHub Actions**

Crea `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: ecommerce-frontend/package-lock.json
        
    - name: Install dependencies
      run: |
        cd ecommerce-frontend
        npm ci
        
    - name: Run tests
      run: |
        cd ecommerce-frontend
        npm run test:ci
        
    - name: Build project
      run: |
        cd ecommerce-frontend
        npm run build
        
    - name: Deploy to Firebase
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: '${{ secrets.GITHUB_TOKEN }}'
        firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
        projectId: tu-proyecto-id
        channelId: live
        entryPoint: './ecommerce-frontend'
```

### **Configurar Secrets**

1. Ve a tu repositorio en GitHub
2. **Settings > Secrets and variables > Actions**
3. Agrega `FIREBASE_SERVICE_ACCOUNT`:

```bash
# Generar service account key
firebase projects:addfirebase tu-proyecto-id
firebase apps:sdkconfig web --project tu-proyecto-id
```

## 📊 **Monitoreo y Analytics**

### **Firebase Analytics**

Agregar en `app.config.ts`:
```typescript
import { provideAnalytics, getAnalytics } from '@angular/fire/analytics';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... otros providers
    provideAnalytics(() => getAnalytics()),
  ]
};
```

### **Performance Monitoring**

```typescript
import { providePerformance, getPerformance } from '@angular/fire/performance';

// Agregar a providers
providePerformance(() => getPerformance())
```

### **Error Reporting**

Configurar Sentry (opcional):
```bash
npm install @sentry/angular

# En app.config.ts
import * as Sentry from '@sentry/angular';

Sentry.init({
  dsn: 'tu-sentry-dsn',
  environment: environment.production ? 'production' : 'development'
});
```

## 🔍 **Troubleshooting**

### **Problemas Comunes**

#### **1. "Page Not Found" después del deploy**

**Problema**: Firebase no encuentra `index.html`

**Solución**:
```json
// Verificar firebase.json
{
  "hosting": {
    "public": "dist/ecommerce-frontend/browser", // ← Ruta correcta
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html" // ← Rewrite para SPA
      }
    ]
  }
}
```

#### **2. Build falla con errores de memoria**

**Problema**: `JavaScript heap out of memory`

**Solución**:
```bash
# Aumentar memoria para Node.js
export NODE_OPTIONS="--max-old-space-size=8192"
ng build --configuration production
```

#### **3. Firebase CLI no reconoce el proyecto**

**Problema**: `Error: No project active`

**Solución**:
```bash
# Verificar proyecto activo
firebase use --add

# O usar proyecto específico
firebase use tu-proyecto-id
```

#### **4. Errores de permisos en Firestore**

**Problema**: `Missing or insufficient permissions`

**Solución**:
```bash
# Verificar reglas de Firestore
firebase firestore:rules:get

# Aplicar reglas desde archivo
firebase deploy --only firestore:rules
```

### **Comandos de Diagnóstico**

```bash
# Verificar configuración
firebase projects:list
firebase use

# Ver logs de hosting
firebase hosting:channel:list
firebase hosting:channel:open preview-channel

# Verificar build
ls -la dist/ecommerce-frontend/browser/

# Test local
firebase serve --only hosting --port 5000
```

## 📈 **Optimizaciones de Producción**

### **1. Configurar Caching**

```json
// firebase.json - Headers optimizados
{
  "hosting": {
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "/index.html",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          }
        ]
      }
    ]
  }
}
```

### **2. Configurar Compresión**

Firebase automáticamente comprime con gzip/brotli, pero puedes optimizar:

```json
{
  "hosting": {
    "headers": [
      {
        "source": "**/*.@(js|css|html)",
        "headers": [
          {
            "key": "Content-Encoding",
            "value": "gzip"
          }
        ]
      }
    ]
  }
}
```

### **3. Preload Critical Resources**

En `index.html`:
```html
<link rel="preload" href="/styles.css" as="style">
<link rel="preload" href="/main.js" as="script">
```

## 🎯 **Environments y Configuración**

### **Multiple Environments**

```bash
# Development
ng build --configuration development
firebase hosting:channel:deploy dev

# Staging  
ng build --configuration staging
firebase hosting:channel:deploy staging

# Production
ng build --configuration production
firebase deploy --only hosting
```

### **Variables de Entorno**

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  firebase: {
    // Configuración de producción
  },
  apiUrl: 'https://api.mitienda.com'
};
```

## 📝 **Checklist de Deployment**

### **Pre-Deploy**
- [ ] Tests pasan (`npm test`)
- [ ] Build exitoso (`ng build --prod`)
- [ ] Linting sin errores (`ng lint`)
- [ ] Variables de entorno configuradas
- [ ] Firebase rules actualizadas

### **Deploy**
- [ ] Build de producción
- [ ] Deploy a Firebase Hosting
- [ ] Verificar URL funciona
- [ ] Probar funcionalidades críticas
- [ ] Verificar Analytics/Monitoring

### **Post-Deploy**
- [ ] Verificar performance (Lighthouse)
- [ ] Probar en diferentes dispositivos
- [ ] Verificar SEO básico
- [ ] Documentar cambios en CHANGELOG

---

## 🆘 **Soporte**

Si encuentras problemas:

1. **Revisa logs**: `firebase hosting:channel:list`
2. **Verifica configuración**: `firebase projects:list`
3. **Consulta documentación**: [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
4. **Comunidad**: [StackOverflow](https://stackoverflow.com/questions/tagged/firebase-hosting)

---

*¡Tu aplicación está lista para el mundo! 🌍*
