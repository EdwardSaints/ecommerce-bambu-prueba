import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';

import { CartService } from './cart.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { mockPrismaService } from '../test/mocks/prisma.mock';
import { mockLoggerService } from '../test/mocks/logger.mock';

describe('CartService', () => {
  let service: CartService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockProduct = {
    id: 'product-id-123',
    title: 'iPhone 15 Pro',
    price: 999.99,
    stock: 50,
    thumbnail: 'https://example.com/thumb.jpg',
    category: {
      id: 'category-id-123',
      name: 'Smartphones',
      slug: 'smartphones',
    },
  };

  const mockCart = {
    id: 'cart-id-123',
    userId: 'user-id-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: 'item-id-123',
        quantity: 2,
        price: 999.99,
        createdAt: new Date(),
        product: mockProduct,
      },
    ],
  };

  const mockCartItem = {
    id: 'item-id-123',
    cartId: 'cart-id-123',
    productId: 'product-id-123',
    quantity: 2,
    price: 999.99,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    prismaService = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('should return user cart', async () => {
      // Arrange
      prismaService.cart.findUnique.mockResolvedValue(mockCart);

      // Act
      const result = await service.getCart('user-id-123');

      // Assert
      expect(prismaService.cart.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-id-123' },
        include: expect.any(Object),
      });
      expect(result).toHaveProperty('id', 'cart-id-123');
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('totalItems');
      expect(result).toHaveProperty('totalAmount');
    });

    it('should throw NotFoundException if cart not found', async () => {
      // Arrange
      prismaService.cart.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getCart('user-id-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addToCart', () => {
    const addToCartDto = {
      productId: 'product-id-123',
      quantity: 2,
    };

    it('should add product to cart successfully', async () => {
      // Arrange
      prismaService.product.findUnique.mockResolvedValue(mockProduct);
      prismaService.cart.findUnique.mockResolvedValue({
        ...mockCart,
        items: [],
      });
      prismaService.cartItem.create.mockResolvedValue(mockCartItem);
      jest.spyOn(service, 'getCart').mockResolvedValue({
        id: 'cart-id-123',
        userId: 'user-id-123',
        items: [
          {
            id: 'item-id-123',
            quantity: 2,
            unitPrice: 999.99,
            totalPrice: 1999.98,
            addedAt: new Date(),
            product: mockProduct,
          },
        ],
        totalItems: 2,
        totalAmount: 1999.98,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await service.addToCart('user-id-123', addToCartDto);

      // Assert
      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'product-id-123' },
        include: expect.any(Object),
      });
      expect(prismaService.cartItem.create).toHaveBeenCalled();
      expect(result).toHaveProperty('items');
      expect(result.totalItems).toBe(2);
    });

    it('should throw NotFoundException if product not found', async () => {
      // Arrange
      prismaService.product.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.addToCart('user-id-123', addToCartDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if insufficient stock', async () => {
      // Arrange
      prismaService.product.findUnique.mockResolvedValue({
        ...mockProduct,
        stock: 1,
      });

      // Act & Assert
      await expect(
        service.addToCart('user-id-123', { ...addToCartDto, quantity: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update existing item quantity', async () => {
      // Arrange
      prismaService.product.findUnique.mockResolvedValue(mockProduct);
      prismaService.cart.findUnique.mockResolvedValue(mockCart);
      prismaService.cartItem.update.mockResolvedValue({
        ...mockCartItem,
        quantity: 4,
      });
      jest.spyOn(service, 'getCart').mockResolvedValue({
        id: 'cart-id-123',
        userId: 'user-id-123',
        items: [
          {
            id: 'item-id-123',
            quantity: 4,
            unitPrice: 999.99,
            totalPrice: 3999.96,
            addedAt: new Date(),
            product: mockProduct,
          },
        ],
        totalItems: 4,
        totalAmount: 3999.96,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await service.addToCart('user-id-123', addToCartDto);

      // Assert
      expect(prismaService.cartItem.update).toHaveBeenCalled();
      expect(result.totalItems).toBe(4);
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      // Arrange
      prismaService.cartItem.findFirst.mockResolvedValue({
        ...mockCartItem,
        product: { title: 'iPhone 15 Pro' },
      });
      prismaService.cartItem.delete.mockResolvedValue(mockCartItem);
      jest.spyOn(service, 'getCart').mockResolvedValue({
        id: 'cart-id-123',
        userId: 'user-id-123',
        items: [],
        totalItems: 0,
        totalAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await service.removeFromCart('user-id-123', 'item-id-123');

      // Assert
      expect(prismaService.cartItem.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'item-id-123',
          cart: { userId: 'user-id-123' },
        },
        include: expect.any(Object),
      });
      expect(prismaService.cartItem.delete).toHaveBeenCalledWith({
        where: { id: 'item-id-123' },
      });
      expect(result.totalItems).toBe(0);
    });

    it('should throw NotFoundException if item not found', async () => {
      // Arrange
      prismaService.cartItem.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.removeFromCart('user-id-123', 'item-id-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', async () => {
      // Arrange
      prismaService.cart.findUnique.mockResolvedValue(mockCart);
      prismaService.cartItem.deleteMany.mockResolvedValue({ count: 1 });

      // Act
      const result = await service.clearCart('user-id-123');

      // Assert
      expect(prismaService.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: 'cart-id-123' },
      });
      expect(result).toEqual({ message: 'Carrito limpiado exitosamente' });
    });

    it('should throw NotFoundException if cart not found', async () => {
      // Arrange
      prismaService.cart.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.clearCart('user-id-123')).rejects.toThrow(NotFoundException);
    });
  });
});