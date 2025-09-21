import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaClient } from '@prisma/client';

import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    address: '123 Main St',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Configurar validación global como en main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Configurar prefijo global
    app.setGlobalPrefix('api');

    await app.init();

    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('tokenType', 'Bearer');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).toHaveProperty('firstName', testUser.firstName);
      expect(response.body.user).toHaveProperty('role', 'CUSTOMER');
      expect(response.body.user).not.toHaveProperty('password');

      // Verificar que el usuario fue creado en la base de datos
      const userInDb = await prisma.user.findUnique({
        where: { email: testUser.email },
      });
      expect(userInDb).toBeTruthy();
      expect(userInDb.email).toBe(testUser.email);

      // Verificar que se creó el carrito
      const cartInDb = await prisma.cart.findUnique({
        where: { userId: userInDb.id },
      });
      expect(cartInDb).toBeTruthy();
    });

    it('should return 400 for invalid email', async () => {
      const invalidUser = {
        ...testUser,
        email: 'invalid-email',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message)).toBe(true);
    });

    it('should return 400 for short password', async () => {
      const invalidUser = {
        ...testUser,
        email: 'test2@example.com',
        password: '123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message)).toBe(true);
    });

    it('should return 409 for duplicate email', async () => {
      // Registrar usuario primero
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...testUser, email: 'duplicate@example.com' })
        .expect(201);

      // Intentar registrar con el mismo email
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...testUser, email: 'duplicate@example.com' })
        .expect(409);

      expect(response.body).toHaveProperty('message', 'El email ya está registrado');
    });
  });

  describe('POST /api/auth/login', () => {
    let registeredUser: any;

    beforeEach(async () => {
      // Registrar usuario para las pruebas de login
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...testUser, email: 'login@example.com' })
        .expect(201);

      registeredUser = registerResponse.body;
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: testUser.password,
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('tokenType', 'Bearer');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(loginData.email);
    });

    it('should return 401 for invalid password', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Credenciales inválidas');
    });

    it('should return 401 for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: testUser.password,
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Credenciales inválidas');
    });

    it('should return 400 for invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: testUser.password,
      };

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      // Registrar y obtener token
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...testUser, email: 'profile@example.com' })
        .expect(201);

      authToken = registerResponse.body.accessToken;
      userId = registerResponse.body.user.id;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('email', 'profile@example.com');
      expect(response.body).toHaveProperty('firstName', testUser.firstName);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return 401 with malformed authorization header', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
    });
  });

  describe('Authentication Flow Integration', () => {
    it('should complete full authentication flow', async () => {
      const userEmail = 'fullflow@example.com';
      
      // 1. Registrar usuario
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...testUser, email: userEmail })
        .expect(201);

      const { accessToken, user } = registerResponse.body;
      expect(accessToken).toBeDefined();
      expect(user.email).toBe(userEmail);

      // 2. Usar token para acceder al perfil
      const profileResponse = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileResponse.body.id).toBe(user.id);

      // 3. Login con las mismas credenciales
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: userEmail,
          password: testUser.password,
        })
        .expect(200);

      expect(loginResponse.body.accessToken).toBeDefined();
      expect(loginResponse.body.user.id).toBe(user.id);

      // 4. Usar nuevo token para acceder al perfil
      const profileResponse2 = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .expect(200);

      expect(profileResponse2.body.id).toBe(user.id);
    });
  });
});
