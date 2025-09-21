import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaClient } from '@prisma/client';

import { AppModule } from '../src/app.module';

describe('Cart (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let userToken: string;
  let userId: string;
  let testProduct: any;
  let testCategory: any;

  const testUser = {
    email: 'cart@example.com',
    password: 'password123',
    firstName: 'Cart',
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

    await setupTestData();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  async function setupTestData() {
    // Registrar usuario
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser);
    
    userToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;

    // Crear categoría de prueba
    testCategory = await prisma.category.create({
      data: {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic products',
      },
    });

    // Crear producto de prueba
    testProduct = await prisma.product.create({
      data: {
        title: 'Test Smartphone',
        description: 'A great smartphone for testing',
        price: 599.99,
        discountPercentage: 10,
        rating: 4.5,
        stock: 50,
        brand: 'TestBrand',
        sku: 'TEST-PHONE-001',
        weight: 0.2,
        dimensions: { width: 7, height: 15, depth: 1 },
        warrantyInformation: '1 year warranty',
        shippingInformation: 'Free shipping',
        availabilityStatus: 'In Stock',
        returnPolicy: '30 days return',
        minimumOrderQuantity: 1,
        images: ['https://example.com/phone.jpg'],
        thumbnail: 'https://example.com/phone-thumb.jpg',
        tags: ['smartphone', 'electronics'],
        categoryId: testCategory.id,
      },
    });
  }

  describe('GET /api/cart', () => {
    it('should return empty cart for new user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('userId', userId);
      expect(response.body).toHaveProperty('items', []);
      expect(response.body).toHaveProperty('totalItems', 0);
      expect(response.body).toHaveProperty('totalAmount', 0);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/cart')
        .expect(401);
    });
  });

  describe('POST /api/cart/items', () => {
    it('should add product to cart successfully', async () => {
      const addToCartData = {
        productId: testProduct.id,
        quantity: 2,
      };

      const response = await request(app.getHttpServer())
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send(addToCartData)
        .expect(201);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].quantity).toBe(2);
      expect(response.body.items[0].unitPrice).toBe(testProduct.price);
      expect(response.body.items[0].totalPrice).toBe(testProduct.price * 2);
      expect(response.body.totalItems).toBe(2);
      expect(response.body.totalAmount).toBe(testProduct.price * 2);
      expect(response.body.items[0].product.id).toBe(testProduct.id);
    });

    it('should update quantity when adding existing product', async () => {
      // Agregar producto por primera vez
      await request(app.getHttpServer())
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 1,
        })
        .expect(201);

      // Agregar el mismo producto otra vez
      const response = await request(app.getHttpServer())
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 2,
        })
        .expect(201);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].quantity).toBe(3); // 1 + 2
      expect(response.body.totalItems).toBe(3);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: 'non-existent-id',
          quantity: 1,
        })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Producto no encontrado');
    });

    it('should return 400 for insufficient stock', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 1000, // Más que el stock disponible
        })
        .expect(400);

      expect(response.body.message).toContain('Stock insuficiente');
    });

    it('should return 400 for invalid quantity', async () => {
      await request(app.getHttpServer())
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 0, // Cantidad inválida
        })
        .expect(400);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .post('/api/cart/items')
        .send({
          productId: testProduct.id,
          quantity: 1,
        })
        .expect(401);
    });
  });

  describe('PUT /api/cart/items/:itemId', () => {
    let cartItemId: string;

    beforeEach(async () => {
      // Agregar producto al carrito
      const response = await request(app.getHttpServer())
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 2,
        });

      cartItemId = response.body.items[0].id;
    });

    it('should update cart item quantity', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 5 })
        .expect(200);

      expect(response.body.items[0].quantity).toBe(5);
      expect(response.body.totalItems).toBe(5);
      expect(response.body.totalAmount).toBe(testProduct.price * 5);
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/cart/items/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 3 })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Item del carrito no encontrado');
    });

    it('should return 400 for insufficient stock', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 1000 })
        .expect(400);

      expect(response.body.message).toContain('Stock insuficiente');
    });
  });

  describe('DELETE /api/cart/items/:itemId', () => {
    let cartItemId: string;

    beforeEach(async () => {
      // Agregar producto al carrito
      const response = await request(app.getHttpServer())
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 3,
        });

      cartItemId = response.body.items[0].id;
    });

    it('should remove item from cart', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.items).toHaveLength(0);
      expect(response.body.totalItems).toBe(0);
      expect(response.body.totalAmount).toBe(0);
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/cart/items/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Item del carrito no encontrado');
    });
  });

  describe('DELETE /api/cart', () => {
    beforeEach(async () => {
      // Agregar algunos productos al carrito
      await request(app.getHttpServer())
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 2,
        });
    });

    it('should clear entire cart', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Carrito limpiado exitosamente');

      // Verificar que el carrito está vacío
      const cartResponse = await request(app.getHttpServer())
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(cartResponse.body.items).toHaveLength(0);
      expect(cartResponse.body.totalItems).toBe(0);
    });
  });

  describe('Cart Integration Flow', () => {
    it('should complete full cart workflow', async () => {
      // 1. Verificar carrito vacío
      let cartResponse = await request(app.getHttpServer())
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(cartResponse.body.items).toHaveLength(0);

      // 2. Agregar producto
      const addResponse = await request(app.getHttpServer())
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 2,
        })
        .expect(201);

      const itemId = addResponse.body.items[0].id;
      expect(addResponse.body.totalItems).toBe(2);

      // 3. Actualizar cantidad
      const updateResponse = await request(app.getHttpServer())
        .put(`/api/cart/items/${itemId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 4 })
        .expect(200);

      expect(updateResponse.body.totalItems).toBe(4);

      // 4. Agregar otro producto (crear segundo producto)
      const secondProduct = await prisma.product.create({
        data: {
          title: 'Second Test Product',
          description: 'Another test product',
          price: 299.99,
          discountPercentage: 5,
          rating: 4.0,
          stock: 30,
          brand: 'TestBrand',
          sku: 'TEST-PRODUCT-002',
          weight: 0.5,
          dimensions: { width: 10, height: 10, depth: 5 },
          warrantyInformation: '6 months warranty',
          shippingInformation: 'Standard shipping',
          availabilityStatus: 'In Stock',
          returnPolicy: '15 days return',
          minimumOrderQuantity: 1,
          images: ['https://example.com/product2.jpg'],
          thumbnail: 'https://example.com/product2-thumb.jpg',
          tags: ['test', 'electronics'],
          categoryId: testCategory.id,
        },
      });

      const addSecondResponse = await request(app.getHttpServer())
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: secondProduct.id,
          quantity: 1,
        })
        .expect(201);

      expect(addSecondResponse.body.items).toHaveLength(2);
      expect(addSecondResponse.body.totalItems).toBe(5); // 4 + 1

      // 5. Eliminar un item
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/api/cart/items/${itemId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(deleteResponse.body.items).toHaveLength(1);
      expect(deleteResponse.body.totalItems).toBe(1);

      // 6. Limpiar carrito
      const clearResponse = await request(app.getHttpServer())
        .delete('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(clearResponse.body.message).toBe('Carrito limpiado exitosamente');

      // 7. Verificar carrito vacío
      const finalCartResponse = await request(app.getHttpServer())
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(finalCartResponse.body.items).toHaveLength(0);
      expect(finalCartResponse.body.totalItems).toBe(0);
    });
  });
});
