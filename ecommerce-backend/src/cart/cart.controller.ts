import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '../common/interfaces/user.interface';

@ApiTags('Carrito de Compras')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Obtener carrito del usuario', 
    description: 'Devuelve el carrito completo del usuario autenticado con todos sus items y totales' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Carrito obtenido exitosamente', 
    type: CartResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'No autorizado - Token inválido' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Carrito no encontrado' 
  })
  async getCart(@CurrentUser() user: User): Promise<CartResponseDto> {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Agregar producto al carrito', 
    description: 'Agrega un producto al carrito del usuario. Si el producto ya existe, incrementa la cantidad' 
  })
  @ApiBody({ type: AddToCartDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Producto agregado al carrito exitosamente', 
    type: CartResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Datos inválidos o stock insuficiente' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'No autorizado - Token inválido' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Producto no encontrado' 
  })
  async addToCart(
    @CurrentUser() user: User,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<CartResponseDto> {
    return this.cartService.addToCart(user.id, addToCartDto);
  }

  @Put('items/:itemId')
  @ApiOperation({ 
    summary: 'Actualizar cantidad de item en el carrito', 
    description: 'Actualiza la cantidad de un producto específico en el carrito' 
  })
  @ApiParam({ 
    name: 'itemId', 
    description: 'ID único del item en el carrito', 
    example: 'clxxx123456789' 
  })
  @ApiBody({ type: UpdateCartItemDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Item actualizado exitosamente', 
    type: CartResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Datos inválidos o stock insuficiente' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'No autorizado - Token inválido' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Item del carrito no encontrado' 
  })
  async updateCartItem(
    @CurrentUser() user: User,
    @Param('itemId') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.updateCartItem(user.id, itemId, updateCartItemDto);
  }

  @Delete('items/:itemId')
  @ApiOperation({ 
    summary: 'Eliminar item del carrito', 
    description: 'Elimina completamente un producto del carrito del usuario' 
  })
  @ApiParam({ 
    name: 'itemId', 
    description: 'ID único del item en el carrito', 
    example: 'clxxx123456789' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Item eliminado exitosamente', 
    type: CartResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'No autorizado - Token inválido' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Item del carrito no encontrado' 
  })
  async removeFromCart(
    @CurrentUser() user: User,
    @Param('itemId') itemId: string,
  ): Promise<CartResponseDto> {
    return this.cartService.removeFromCart(user.id, itemId);
  }

  @Delete()
  @ApiOperation({ 
    summary: 'Limpiar carrito completo', 
    description: 'Elimina todos los items del carrito del usuario' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Carrito limpiado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Carrito limpiado exitosamente'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'No autorizado - Token inválido' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Carrito no encontrado' 
  })
  async clearCart(@CurrentUser() user: User): Promise<{ message: string }> {
    return this.cartService.clearCart(user.id);
  }
}