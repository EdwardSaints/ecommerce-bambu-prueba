import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let authService: jest.Mocked<AuthService>;

  const mockAuthResponse = {
    accessToken: 'jwt-token-123',
    tokenType: 'Bearer',
    expiresIn: 604800,
    user: {
      id: 'user-id-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      address: '123 Main St',
      role: 'CUSTOMER',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  };

  const mockUserProfile = {
    id: 'user-id-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    address: '123 Main St',
    role: 'CUSTOMER',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            getProfile: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    authService = moduleFixture.get(AuthService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      // Arrange
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        address: '123 Main St',
      };
      authService.register.mockResolvedValue(mockAuthResponse);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toEqual(mockAuthResponse);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should return 400 for invalid data', async () => {
      // Arrange
      const invalidDto = {
        email: 'invalid-email',
        password: '123', // Too short
      };

      // Act & Assert
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidDto)
        .expect(400);
    });

    it('should return 409 for existing email', async () => {
      // Arrange
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };
      authService.register.mockRejectedValue({
        response: { statusCode: 409, message: 'El email ya está registrado' },
        status: 409,
      });

      // Act & Assert
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);
    });
  });

  describe('POST /auth/login', () => {
    it('should login user successfully', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      authService.login.mockResolvedValue(mockAuthResponse);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toEqual(mockAuthResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should return 400 for invalid credentials format', async () => {
      // Arrange
      const invalidDto = {
        email: 'invalid-email',
        password: '',
      };

      // Act & Assert
      await request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidDto)
        .expect(400);
    });

    it('should return 401 for wrong credentials', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      authService.login.mockRejectedValue({
        response: { statusCode: 401, message: 'Credenciales inválidas' },
        status: 401,
      });

      // Act & Assert
      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });
  });

  describe('GET /auth/profile', () => {
    it('should return user profile with valid token', async () => {
      // Arrange
      authService.getProfile.mockResolvedValue(mockUserProfile);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer valid-jwt-token')
        .expect(200);

      expect(response.body).toEqual(mockUserProfile);
    });

    it('should return 401 without token', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});