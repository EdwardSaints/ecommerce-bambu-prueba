import { 
  Injectable, 
  Logger, 
  NotFoundException, 
  BadRequestException,
  ConflictException 
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartResponseDto, CartItemResponseDto } from './dto/cart-response.dto';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly loggerService: LoggerService,
  ) {}

  async getCart(userId: string): Promise<CartResponseDto> {
    try {
      const cart = await this.prismaService.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!cart) {
        throw new NotFoundException('Carrito no encontrado');
      }

      return this.mapToCartResponse(cart);
    } catch (error) {
      this.loggerService.error(
        `Error al obtener carrito del usuario: ${userId}`,
        error.stack,
        'CartService'
      );
      throw error;
    }
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<CartResponseDto> {
    const { productId, quantity } = addToCartDto;

    try {
      // Verificar que el producto existe y tiene stock suficiente
      const product = await this.prismaService.product.findUnique({
        where: { id: productId },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      if (!product) {
        throw new NotFoundException('Producto no encontrado');
      }

      if (product.stock < quantity) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${product.stock}, solicitado: ${quantity}`
        );
      }

      // Obtener o crear carrito
      let cart = await this.prismaService.cart.findUnique({
        where: { userId },
        include: { items: true },
      });

      if (!cart) {
        cart = await this.prismaService.cart.create({
          data: { userId },
          include: { items: true },
        });
      }

      // Verificar si el producto ya está en el carrito
      const existingItem = cart.items.find(item => item.productId === productId);

      if (existingItem) {
        // Actualizar cantidad del item existente
        const newQuantity = existingItem.quantity + quantity;
        
        if (product.stock < newQuantity) {
          throw new BadRequestException(
            `Stock insuficiente. Disponible: ${product.stock}, en carrito: ${existingItem.quantity}, solicitado: ${quantity}`
          );
        }

        await this.prismaService.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: newQuantity,
            price: product.price,
          },
        });
      } else {
        // Crear nuevo item en el carrito
        await this.prismaService.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
            price: product.price,
          },
        });
      }

      this.loggerService.log(
        `Producto agregado al carrito: ${product.title} (cantidad: ${quantity})`,
        'CartService',
        { userId, productId, quantity }
      );

      return this.getCart(userId);
    } catch (error) {
      this.loggerService.error(
        `Error al agregar producto al carrito: ${productId}`,
        error.stack,
        'CartService',
        { userId, productId, quantity }
      );
      throw error;
    }
  }

  async updateCartItem(
    userId: string, 
    itemId: string, 
    updateCartItemDto: UpdateCartItemDto
  ): Promise<CartResponseDto> {
    const { quantity } = updateCartItemDto;

    try {
      // Verificar que el item pertenece al usuario
      const cartItem = await this.prismaService.cartItem.findFirst({
        where: {
          id: itemId,
          cart: { userId },
        },
        include: {
          product: true,
        },
      });

      if (!cartItem) {
        throw new NotFoundException('Item del carrito no encontrado');
      }

      // Verificar stock disponible
      if (cartItem.product.stock < quantity) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${cartItem.product.stock}, solicitado: ${quantity}`
        );
      }

      // Actualizar cantidad
      await this.prismaService.cartItem.update({
        where: { id: itemId },
        data: {
          quantity,
          price: cartItem.product.price, // Actualizar precio por si cambió
        },
      });

      this.loggerService.log(
        `Item del carrito actualizado: ${cartItem.product.title} (nueva cantidad: ${quantity})`,
        'CartService',
        { userId, itemId, quantity }
      );

      return this.getCart(userId);
    } catch (error) {
      this.loggerService.error(
        `Error al actualizar item del carrito: ${itemId}`,
        error.stack,
        'CartService',
        { userId, itemId, quantity }
      );
      throw error;
    }
  }

  async removeFromCart(userId: string, itemId: string): Promise<CartResponseDto> {
    try {
      // Verificar que el item pertenece al usuario
      const cartItem = await this.prismaService.cartItem.findFirst({
        where: {
          id: itemId,
          cart: { userId },
        },
        include: {
          product: {
            select: { title: true },
          },
        },
      });

      if (!cartItem) {
        throw new NotFoundException('Item del carrito no encontrado');
      }

      // Eliminar item
      await this.prismaService.cartItem.delete({
        where: { id: itemId },
      });

      this.loggerService.log(
        `Item eliminado del carrito: ${cartItem.product.title}`,
        'CartService',
        { userId, itemId }
      );

      return this.getCart(userId);
    } catch (error) {
      this.loggerService.error(
        `Error al eliminar item del carrito: ${itemId}`,
        error.stack,
        'CartService',
        { userId, itemId }
      );
      throw error;
    }
  }

  async clearCart(userId: string): Promise<{ message: string }> {
    try {
      const cart = await this.prismaService.cart.findUnique({
        where: { userId },
        include: { items: true },
      });

      if (!cart) {
        throw new NotFoundException('Carrito no encontrado');
      }

      // Eliminar todos los items del carrito
      await this.prismaService.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      this.loggerService.log(
        `Carrito limpiado completamente`,
        'CartService',
        { userId, itemsRemoved: cart.items.length }
      );

      return { message: 'Carrito limpiado exitosamente' };
    } catch (error) {
      this.loggerService.error(
        `Error al limpiar carrito`,
        error.stack,
        'CartService',
        { userId }
      );
      throw error;
    }
  }

  private mapToCartResponse(cart: any): CartResponseDto {
    const items: CartItemResponseDto[] = cart.items.map(item => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: item.price,
      totalPrice: item.quantity * item.price,
      addedAt: item.createdAt,
      product: {
        id: item.product.id,
        title: item.product.title,
        thumbnail: item.product.thumbnail,
        stock: item.product.stock,
        category: {
          id: item.product.category.id,
          name: item.product.category.name,
          slug: item.product.category.slug,
        },
      },
    }));

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    return {
      id: cart.id,
      userId: cart.userId,
      items,
      totalItems,
      totalAmount,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }
}