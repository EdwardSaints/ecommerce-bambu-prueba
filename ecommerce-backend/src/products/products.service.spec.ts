import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { ProductsService } from './products.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { DummyjsonService } from '../external/dummyjson/dummyjson.service';
import { CategoriesService } from '../categories/categories.service';

import { mockPrismaService } from '../test/mocks/prisma.mock';
import { mockLoggerService } from '../test/mocks/logger.mock';
import {
  mockDummyjsonService,
  mockDummyJSONResponse,
  mockDummyJSONCategories,
} from '../test/mocks/dummyjson.mock';

describe('ProductsService', () => {
  let service: ProductsService;
  let prismaService: jest.Mocked<PrismaService>;
  let dummyjsonService: jest.Mocked<DummyjsonService>;
  let categoriesService: jest.Mocked<CategoriesService>;

  const mockProduct = {
    id: 'product-id-123',
    title: 'iPhone 15 Pro',
    description: 'El iPhone más avanzado',
    price: 999.99,
    discountPercentage: 10.5,
    rating: 4.8,
    stock: 50,
    brand: 'Apple',
    sku: 'IPH15PRO256',
    weight: 0.187,
    dimensions: { width: 70.6, height: 146.6, depth: 8.25 },
    warrantyInformation: '1 año de garantía',
    shippingInformation: 'Envío gratis en 24h',
    availabilityStatus: 'In Stock',
    reviews: [],
    returnPolicy: '30 días de devolución',
    minimumOrderQuantity: 1,
    images: ['https://example.com/image1.jpg'],
    thumbnail: 'https://example.com/thumb.jpg',
    tags: ['smartphone', 'apple'],
    externalId: 1,
    lastSyncAt: new Date(),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    categoryId: 'category-id-123',
    category: {
      id: 'category-id-123',
      name: 'Smartphones',
      slug: 'smartphones',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
        {
          provide: DummyjsonService,
          useValue: mockDummyjsonService,
        },
        {
          provide: CategoriesService,
          useValue: {
            createOrUpdate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prismaService = module.get(PrismaService);
    dummyjsonService = module.get(DummyjsonService);
    categoriesService = module.get(CategoriesService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      // Arrange
      const query = { page: 1, limit: 10 };
      prismaService.product.findMany.mockResolvedValue([mockProduct]);
      prismaService.product.count.mockResolvedValue(1);

      // Act
      const result = await service.findAll(query);

      // Assert
      expect(prismaService.product.findMany).toHaveBeenCalled();
      expect(prismaService.product.count).toHaveBeenCalled();
      expect(result).toHaveProperty('products');
      expect(result).toHaveProperty('pagination');
      expect(result.products).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should filter products by category', async () => {
      // Arrange
      const query = { category: 'smartphones', page: 1, limit: 10 };
      prismaService.product.findMany.mockResolvedValue([mockProduct]);
      prismaService.product.count.mockResolvedValue(1);

      // Act
      await service.findAll(query);

      // Assert
      expect(prismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: expect.objectContaining({
              slug: 'smartphones',
            }),
          }),
        }),
      );
    });

    it('should search products by title', async () => {
      // Arrange
      const query = { search: 'iPhone', page: 1, limit: 10 };
      prismaService.product.findMany.mockResolvedValue([mockProduct]);
      prismaService.product.count.mockResolvedValue(1);

      // Act
      await service.findAll(query);

      // Assert
      expect(prismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            title: expect.objectContaining({
              contains: 'iPhone',
              mode: 'insensitive',
            }),
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return product by id', async () => {
      // Arrange
      prismaService.product.findUnique.mockResolvedValue(mockProduct);

      // Act
      const result = await service.findById('product-id-123');

      // Assert
      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'product-id-123', isActive: true },
        include: expect.any(Object),
      });
      expect(result).toEqual(expect.objectContaining({
        id: mockProduct.id,
        title: mockProduct.title,
      }));
    });

    it('should throw NotFoundException for non-existent product', async () => {
      // Arrange
      prismaService.product.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('syncProductsFromDummyJSON', () => {
    it('should sync products successfully', async () => {
      // Arrange
      dummyjsonService.getCategories.mockResolvedValue(mockDummyJSONCategories);
      dummyjsonService.getAllProducts.mockResolvedValueOnce(mockDummyJSONResponse);
      dummyjsonService.getAllProducts.mockResolvedValueOnce({ ...mockDummyJSONResponse, products: [] });
      
      prismaService.category.findUnique.mockResolvedValue({
        id: 'category-id-123',
        name: 'Smartphones',
        slug: 'smartphones',
        description: 'Productos de Smartphones',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      prismaService.product.upsert.mockResolvedValue(mockProduct);

      // Act
      const result = await service.syncProductsFromDummyJSON();

      // Assert
      expect(dummyjsonService.getCategories).toHaveBeenCalled();
      expect(dummyjsonService.getAllProducts).toHaveBeenCalled();
      expect(categoriesService.createOrUpdate).toHaveBeenCalled();
      expect(result).toHaveProperty('synchronized');
      expect(result).toHaveProperty('errors');
      expect(result.synchronized).toBeGreaterThan(0);
    });

    it('should handle sync errors gracefully', async () => {
      // Arrange
      dummyjsonService.getCategories.mockRejectedValue(new Error('API Error'));

      // Act
      const result = await service.syncProductsFromDummyJSON();

      // Assert
      expect(result.errors).toBeGreaterThan(0);
      expect(result.synchronized).toBe(0);
    });
  });
});