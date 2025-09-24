import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configuración global de validación
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en DTOs
      forbidNonWhitelisted: true, // Lanza error si hay propiedades no permitidas
      transform: true, // Transforma automáticamente los tipos
      transformOptions: {
        enableImplicitConversion: true, // Conversión automática de tipos
      },
    }),
  );

  // Configuración de CORS
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://tu-dominio.com', 'https://www.tu-dominio.com']
      : true, // En desarrollo permite cualquier origen
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Configuración de versionado de API
  app.setGlobalPrefix('api', {
    exclude: ['/'], // Excluir health check
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Configuración de Swagger/OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('eCommerce API')
    .setDescription(`
      ## API RESTful Completa para eCommerce
      
      Esta API proporciona todas las funcionalidades necesarias para un eCommerce moderno:
      
      ### Características principales:
      - **Autenticación JWT** con roles de usuario
      - **Gestión de productos** con sincronización automática
      - **Carrito de compras** con validación de stock
      - **Categorías dinámicas** desde API externa
      - **Cron Jobs** para sincronización automática
      - **Rate Limiting** y seguridad avanzada
      - **Logging centralizado** de operaciones
      
      ### Autenticación:
      1. Registra un usuario con \`POST /auth/register\`
      2. Inicia sesión con \`POST /auth/login\`
      3. Usa el token JWT en el header: \`Authorization: Bearer <token>\`
      
      ### Datos de prueba:
      - La API sincroniza productos automáticamente desde [DummyJSON](https://dummyjson.com)
      - Puedes forzar la sincronización con \`POST /products/sync\` (requiere admin)
      
      ### Tecnologías:
      - **Backend**: Node.js + TypeScript + NestJS
      - **Base de datos**: PostgreSQL + Prisma ORM
      - **Autenticación**: JWT + Passport
      - **Documentación**: OpenAPI 3.0
    `)
    .setVersion('1.0.0')
    .setContact(
      'Equipo de Desarrollo',
      'https://tu-empresa.com',
      'soporte@tu-empresa.com'
    )
    .setLicense(
      'MIT License',
      'https://opensource.org/licenses/MIT'
    )
    .addServer('http://localhost:3000', 'Desarrollo Local')
    .addServer('https://api.tu-dominio.com', 'Producción')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa tu token JWT',
        in: 'header',
      },
      'JWT-auth', // Este nombre se usa en @ApiBearerAuth()
    )
    .addTag('General', 'Endpoints generales y health checks')
    .addTag('Autenticación', 'Registro, login y gestión de usuarios')
    .addTag('Productos', 'Gestión y consulta de productos')
    .addTag('Categorías', 'Gestión de categorías de productos')
    .addTag('Carrito de Compras', 'Gestión del carrito de compras')
    .addTag('Tareas Programadas', 'Cron jobs y sincronización automática')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    deepScanRoutes: true,
  });

  // Configurar Swagger UI
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Mantener token entre recargas
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none', // Colapsar por defecto
      filter: true, // Habilitar filtro de búsqueda
      showRequestDuration: true, // Mostrar tiempo de respuesta
      tryItOutEnabled: true, // Habilitar "Try it out"
    },
    customSiteTitle: 'eCommerce API - Documentación',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #1976d2; }
      .swagger-ui .scheme-container { background: #fafafa; padding: 15px; border-radius: 4px; }
    `,
  });

  // Endpoint para descargar el JSON de OpenAPI
  app.getHttpAdapter().get('/api-json', (req, res) => {
    res.json(document);
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  console.log(`
 Aplicación iniciada exitosamente!
API: http://localhost:${port}
Swagger UI: http://localhost:${port}/api
OpeAPI JSON: http://localhost:${port}/api-json
Health Check: http://localhost:${port}
  `);
}

bootstrap();
