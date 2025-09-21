import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductQueryDto } from './dto/product-query.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { ProductsPaginatedResponseDto } from './dto/products-paginated-response.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Productos')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Obtener productos con filtros y paginación',
    description: 'Devuelve una lista paginada de productos con filtros opcionales',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos obtenida exitosamente',
    type: ProductsPaginatedResponseDto,
  })
  async findAll(@Query() query: ProductQueryDto): Promise<ProductsPaginatedResponseDto> {
    return this.productsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener producto por ID',
    description: 'Devuelve los detalles completos de un producto específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del producto',
    example: 'clxxx123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'Producto encontrado',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado',
  })
  async findById(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.productsService.findById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('sync')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Sincronizar productos desde DummyJSON',
    description: 'Sincroniza todos los productos desde la API externa de DummyJSON (solo administradores)',
  })
  @ApiResponse({
    status: 200,
    description: 'Sincronización completada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Sincronización completada' },
        synchronized: { type: 'number', example: 194 },
        errors: { type: 'number', example: 0 },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Prohibido - Se requieren permisos de administrador',
  })
  async syncProducts() {
    const result = await this.productsService.syncProductsFromDummyJSON();
    return {
      message: 'Sincronización completada',
      synchronized: result.synchronized,
      errors: result.errors,
    };
  }
}
