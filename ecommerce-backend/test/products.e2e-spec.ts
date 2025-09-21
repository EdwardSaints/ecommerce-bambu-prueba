import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaClient } from '@prisma/client';

import { AppModule } from '../src/app.module';

describe('Products (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let adminToken: string;
  let customerToken: string;

  const testAdmin = {
    email: 'admin@example.com',
    password: 'adminpass123',
    firstName: 'Admin',
    lastName: 'User',
  };

  const testCustomer = {
    email: 'customer@example.com',
    password: 'customerpass123',
    firstName: 'Customer',
    lastName: 'User',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
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

    app.setGlobalPrefix('api');
    await app.init();

    prisma = new PrismaClient();

    // Crear usuarios de prueba
    await setupTestUsers();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  async function setupTestUsers() {
    // Registrar admin
    const adminResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testAdmin);
    
    // Cambiar rol a ADMIN
    await prisma.user.update({
      where: { email: testAdmin.email },
      data: { role: 'ADMIN' },
    });

    // Login como admin para obtener token
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: testAdmin.email,
        password: testAdmin.password,
      });
    
    adminToken = adminLoginResponse.body.accessToken;

    // Registrar customer
    const customerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testCustomer);
    
    customerToken = customerResponse.body.accessToken;
  }

  async function createTestCategory() {
    return await prisma.category.create({
      data: {
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test category description',
      },
    });
  }

  async function createTestProduct(categoryId: string) {
    return await prisma.product.create({
      data: {
        title: 'Test Product',
        description: 'Test product description',
        price: 99.99,
        discountPercentage: 10,
        rating: 4.5,
        stock: 100,
        brand: 'Test Brand',
        sku: 'TEST-SKU-001',
        weight: 1.0,
        dimensions: { width: 10, height: 10, depth: 10 },
        warrantyInformation: '1 year warranty',
        shippingInformation: 'Free shipping',
        availabilityStatus: 'In Stock',
        returnPolicy: '30 days return',
        minimumOrderQuantity: 1,
        images: ['https://example.com/image1.jpg'],
        thumbnail: 'https://example.com/thumb.jpg',
        tags: ['test', 'product'],
        categoryId,
      },
    });
  }

  describe('GET /api/products', () => {
    it('should return empty list when no products exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products')
        .expect(200);

      expect(response.body).toHaveProperty('products', []);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination.total).toBe(0);
    });

    it('should return products with pagination', async () => {
      // Crear categoría y productos de prueba
      const category = await createTestCategory();
      await createTestProduct(category.id);
      await createTestProduct(category.id);

      const response = await request(app.getHttpServer())
        .get('/api/products?limit=1')
        .expect(200);

      expect(response.body.products).toHaveLength(1);
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.hasNext).toBe(true);
    });

    it('should filter products by category', async () => {
      const category1 = await createTestCategory();
      const category2 = await prisma.category.create({
        data: {
          name: 'Category 2',
          slug: 'category-2',
          description: 'Second category',
        },
      });

      await createTestProduct(category1.id);
      await createTestProduct(category2.id);

      const response = await request(app.getHttpServer())
        .get(`/api/products?category=${category1.slug}`)
        .expect(200);

      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0].category.slug).toBe(category1.slug);
    });

    it('should search products by title', async () => {
      const category = await createTestCategory();
      
      await prisma.product.create({
        data: {
          title: 'iPhone 15 Pro',
          description: 'Apple smartphone',
          price: 999.99,
          discountPercentage: 0,
          rating: 4.8,
          stock: 50,
          brand: 'Apple',
          sku: 'IPHONE-15-PRO',
          weight: 0.2,
          dimensions: { width: 7, height: 15, depth: 1 },
          warrantyInformation: '1 year warranty',
          shippingInformation: 'Free shipping',
          availabilityStatus: 'In Stock',
          returnPolicy: '30 days return',
          minimumOrderQuantity: 1,
          images: ['https://example.com/iphone.jpg'],
          thumbnail: 'https://example.com/iphone-thumb.jpg',
          tags: ['smartphone', 'apple'],
          categoryId: category.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/products?search=iPhone')
        .expect(200);

      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0].title).toContain('iPhone');
    });

    it('should filter by price range', async () => {
      const category = await createTestCategory();
      
      // Producto barato
      await prisma.product.create({
        data: {
          title: 'Cheap Product',
          description: 'Affordable item',
          price: 10.00,
          discountPercentage: 0,
          rating: 3.0,
          stock: 100,
          brand: 'Budget Brand',
          sku: 'CHEAP-001',
          weight: 0.1,
          dimensions: { width: 5, height: 5, depth: 1 },
          warrantyInformation: '6 months warranty',
          shippingInformation: 'Standard shipping',
          availabilityStatus: 'In Stock',
          returnPolicy: '15 days return',
          minimumOrderQuantity: 1,
          images: ['https://example.com/cheap.jpg'],
          thumbnail: 'https://example.com/cheap-thumb.jpg',
          tags: ['budget'],
          categoryId: category.id,
        },
      });

      // Producto caro
      await prisma.product.create({
        data: {
          title: 'Expensive Product',
          description: 'Premium item',
          price: 1000.00,
          discountPercentage: 0,
          rating: 5.0,
          stock: 10,
          brand: 'Premium Brand',
          sku: 'EXPENSIVE-001',
          weight: 2.0,
          dimensions: { width: 20, height: 20, depth: 5 },
          warrantyInformation: '2 years warranty',
          shippingInformation: 'Express shipping',
          availabilityStatus: 'In Stock',
          returnPolicy: '60 days return',
          minimumOrderQuantity: 1,
          images: ['https://example.com/expensive.jpg'],
          thumbnail: 'https://example.com/expensive-thumb.jpg',
          tags: ['premium'],
          categoryId: category.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/products?minPrice=50&maxPrice=500')
        .expect(200);

      expect(response.body.products).toHaveLength(0);

      const response2 = await request(app.getHttpServer())
        .get('/api/products?minPrice=5&maxPrice=50')
        .expect(200);

      expect(response2.body.products).toHaveLength(1);
      expect(response2.body.products[0].title).toBe('Cheap Product');
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return product by id', async () => {
      const category = await createTestCategory();
      const product = await createTestProduct(category.id);

      const response = await request(app.getHttpServer())
        .get(`/api/products/${product.id}`)
        .expect(200);

      expect(response.body.id).toBe(product.id);
      expect(response.body.title).toBe(product.title);
      expect(response.body.category).toHaveProperty('id', category.id);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Producto no encontrado');
    });
  });

  describe('POST /api/products/sync', () => {
    it('should sync products successfully with admin token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/products/sync')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Sincronización completada');
      expect(response.body).toHaveProperty('synchronized');
      expect(response.body).toHaveProperty('errors');
      expect(typeof response.body.synchronized).toBe('number');
      expect(typeof response.body.errors).toBe('number');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .post('/api/products/sync')
        .expect(401);
    });

    it('should return 403 with customer token', async () => {
      await request(app.getHttpServer())
        .post('/api/products/sync')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .post('/api/products/sync')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Products Integration Flow', () => {
    it('should complete full product flow', async () => {
      // 1. Sincronizar productos (como admin)
      const syncResponse = await request(app.getHttpServer())
        .post('/api/products/sync')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(syncResponse.body.synchronized).toBeGreaterThan(0);

      // 2. Listar productos (público)
      const listResponse = await request(app.getHttpServer())
        .get('/api/products?limit=5')
        .expect(200);

      expect(listResponse.body.products.length).toBeGreaterThan(0);
      const firstProduct = listResponse.body.products[0];

      // 3. Obtener producto específico
      const productResponse = await request(app.getHttpServer())
        .get(`/api/products/${firstProduct.id}`)
        .expect(200);

      expect(productResponse.body.id).toBe(firstProduct.id);

      // 4. Buscar productos
      const searchResponse = await request(app.getHttpServer())
        .get(`/api/products?search=${firstProduct.title.split(' ')[0]}`)
        .expect(200);

      expect(searchResponse.body.products.length).toBeGreaterThan(0);

      // 5. Filtrar por categoría
      const categoryResponse = await request(app.getHttpServer())
        .get(`/api/products?category=${firstProduct.category.slug}`)
        .expect(200);

      expect(categoryResponse.body.products.length).toBeGreaterThan(0);
      expect(categoryResponse.body.products[0].category.slug).toBe(firstProduct.category.slug);
    });
  });
});
