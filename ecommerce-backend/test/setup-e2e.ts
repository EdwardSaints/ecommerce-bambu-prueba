import { PrismaClient } from '@prisma/client';

// Configuración global para pruebas e2e
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-e2e';
process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/ecommerce_test_db';
process.env.LOG_LEVEL = 'error'; // Reducir logs en tests

// Cliente Prisma para limpieza de base de datos
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Limpiar base de datos antes de cada test
beforeEach(async () => {
  // Limpiar en orden para evitar errores de foreign key
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemLog.deleteMany();
});

// Cerrar conexión después de todos los tests
afterAll(async () => {
  await prisma.$disconnect();
});
