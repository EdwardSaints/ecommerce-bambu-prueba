import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { CategoryResponseDto } from './dto/category-response.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly loggerService: LoggerService,
  ) {}

  async findAll(): Promise<CategoryResponseDto[]> {
    try {
      const categories = await this.prismaService.category.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { products: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      return categories.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description || undefined,
        isActive: category.isActive,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        productCount: category._count.products,
      }));
    } catch (error) {
      this.loggerService.error(
        'Error al obtener categorías',
        error.stack,
        'CategoriesService'
      );
      throw error;
    }
  }

  async findBySlug(slug: string): Promise<CategoryResponseDto | null> {
    try {
      const category = await this.prismaService.category.findUnique({
        where: { slug, isActive: true },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });

      if (!category) return null;

      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description || undefined,
        isActive: category.isActive,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        productCount: category._count.products,
      };
    } catch (error) {
      this.loggerService.error(
        `Error al obtener categoría por slug: ${slug}`,
        error.stack,
        'CategoriesService'
      );
      throw error;
    }
  }

  async createOrUpdate(name: string, slug: string, description?: string) {
    try {
      const category = await this.prismaService.category.upsert({
        where: { slug },
        update: {
          name,
          description,
          isActive: true,
        },
        create: {
          name,
          slug,
          description,
          isActive: true,
        },
      });

      this.logger.log(`Categoría sincronizada: ${name} (${slug})`);
      return category;
    } catch (error) {
      this.loggerService.error(
        `Error al crear/actualizar categoría: ${name}`,
        error.stack,
        'CategoriesService'
      );
      throw error;
    }
  }
}
