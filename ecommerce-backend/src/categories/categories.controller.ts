import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Categorías')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Obtener todas las categorías',
    description: 'Devuelve una lista de todas las categorías activas con el número de productos',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorías obtenida exitosamente',
    type: [CategoryResponseDto],
  })
  async findAll(): Promise<CategoryResponseDto[]> {
    return this.categoriesService.findAll();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({
    summary: 'Obtener categoría por slug',
    description: 'Devuelve los detalles de una categoría específica',
  })
  @ApiParam({
    name: 'slug',
    description: 'Slug de la categoría',
    example: 'smartphones',
  })
  @ApiResponse({
    status: 200,
    description: 'Categoría encontrada',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Categoría no encontrada',
  })
  async findBySlug(@Param('slug') slug: string): Promise<CategoryResponseDto | null> {
    return this.categoriesService.findBySlug(slug);
  }
}
