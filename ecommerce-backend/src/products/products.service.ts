import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { DummyjsonService, DummyJSONProduct } from '../external/dummyjson/dummyjson.service';
import { CategoriesService } from '../categories/categories.service';
import { ProductQueryDto } from './dto/product-query.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { ProductsPaginatedResponseDto } from './dto/products-paginated-response.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly loggerService: LoggerService,
    private readonly dummyjsonService: DummyjsonService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async findAll(query: ProductQueryDto): Promise<ProductsPaginatedResponseDto> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        category,
        minPrice,
        maxPrice,
        brand,
        inStock,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = query;

      const skip = (page - 1) * limit;

      // Construir filtros
      const where: any = {
        isActive: true,
      };

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [search] } },
        ];
      }

      if (category) {
        where.category = { slug: category };
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = minPrice;
        if (maxPrice !== undefined) where.price.lte = maxPrice;
      }

      if (brand) {
        where.brand = { contains: brand, mode: 'insensitive' };
      }

      if (inStock) {
        where.stock = { gt: 0 };
      }

      // Ejecutar consultas en paralelo
      const [products, total] = await Promise.all([
        this.prismaService.product.findMany({
          where,
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        this.prismaService.product.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        products: products.map(this.mapToProductResponse),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.loggerService.error(
        'Error al obtener productos',
        error.stack,
        'ProductsService'
      );
      throw error;
    }
  }

  async findById(id: string): Promise<ProductResponseDto> {
    try {
      const product = await this.prismaService.product.findUnique({
        where: { id, isActive: true },
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
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }

      return this.mapToProductResponse(product);
    } catch (error) {
      this.loggerService.error(
        `Error al obtener producto por ID: ${id}`,
        error.stack,
        'ProductsService'
      );
      throw error;
    }
  }

  async syncProductsFromDummyJSON(): Promise<{ synchronized: number; errors: number }> {
    this.logger.log('Iniciando sincronización de productos desde DummyJSON...');
    
    let synchronized = 0;
    let errors = 0;
    let skip = 0;
    const limit = 30;

    try {
      // Primero sincronizar categorías
      await this.syncCategories();

      // Sincronizar productos en lotes
      while (true) {
        const response = await this.dummyjsonService.getAllProducts(limit, skip);
        
        if (response.products.length === 0) break;

        for (const dummyProduct of response.products) {
          try {
            await this.syncSingleProduct(dummyProduct);
            synchronized++;
          } catch (error) {
            this.logger.error(`Error sincronizando producto ${dummyProduct.id}: ${error.message}`);
            errors++;
          }
        }

        skip += limit;
        
        // Si obtuvimos menos productos que el límite, hemos terminado
        if (response.products.length < limit) break;
      }

      this.loggerService.log(
        `Sincronización completada: ${synchronized} productos sincronizados, ${errors} errores`,
        'ProductsService',
        { synchronized, errors }
      );

      return { synchronized, errors };
    } catch (error) {
      this.loggerService.error(
        'Error durante la sincronización de productos',
        error.stack,
        'ProductsService'
      );
      throw error;
    }
  }

  private async syncCategories(): Promise<void> {
    try {
      const categories = await this.dummyjsonService.getCategories();
      
      for (const category of categories) {
        await this.categoriesService.createOrUpdate(
          this.capitalizeWords(category.name || category.slug),
          category.slug,
          `Productos de ${this.capitalizeWords(category.name || category.slug)}`
        );
      }

      this.logger.log(`${categories.length} categorías sincronizadas`);
    } catch (error) {
      this.logger.error(`Error sincronizando categorías: ${error.message}`);
      throw error;
    }
  }

  private async syncSingleProduct(dummyProduct: DummyJSONProduct): Promise<void> {
    // Buscar o crear categoría
    let category = await this.categoriesService.findBySlug(dummyProduct.category);
    
    if (!category) {
      const createdCategory = await this.categoriesService.createOrUpdate(
        this.capitalizeWords(dummyProduct.category),
        dummyProduct.category,
        `Productos de ${this.capitalizeWords(dummyProduct.category)}`
      );
      category = await this.categoriesService.findBySlug(createdCategory.slug);
    }

    // Sincronizar producto
    await this.prismaService.product.upsert({
      where: { externalId: dummyProduct.id },
      update: {
        title: dummyProduct.title,
        description: dummyProduct.description,
        price: dummyProduct.price,
        discountPercentage: dummyProduct.discountPercentage,
        rating: dummyProduct.rating,
        stock: dummyProduct.stock,
        brand: dummyProduct.brand,
        sku: dummyProduct.sku,
        weight: dummyProduct.weight,
        dimensions: dummyProduct.dimensions,
        warrantyInformation: dummyProduct.warrantyInformation,
        shippingInformation: dummyProduct.shippingInformation,
        availabilityStatus: dummyProduct.availabilityStatus,
        reviews: dummyProduct.reviews,
        returnPolicy: dummyProduct.returnPolicy,
        minimumOrderQuantity: dummyProduct.minimumOrderQuantity,
        images: dummyProduct.images,
        thumbnail: dummyProduct.thumbnail,
        tags: dummyProduct.tags,
        lastSyncAt: new Date(),
        isActive: true,
      },
      create: {
        title: dummyProduct.title,
        description: dummyProduct.description,
        price: dummyProduct.price,
        discountPercentage: dummyProduct.discountPercentage,
        rating: dummyProduct.rating,
        stock: dummyProduct.stock,
        brand: dummyProduct.brand,
        sku: dummyProduct.sku,
        weight: dummyProduct.weight,
        dimensions: dummyProduct.dimensions,
        warrantyInformation: dummyProduct.warrantyInformation,
        shippingInformation: dummyProduct.shippingInformation,
        availabilityStatus: dummyProduct.availabilityStatus,
        reviews: dummyProduct.reviews,
        returnPolicy: dummyProduct.returnPolicy,
        minimumOrderQuantity: dummyProduct.minimumOrderQuantity,
        images: dummyProduct.images,
        thumbnail: dummyProduct.thumbnail,
        tags: dummyProduct.tags,
        externalId: dummyProduct.id,
        lastSyncAt: new Date(),
        categoryId: category!.id,
        isActive: true,
      },
    });
  }

  private mapToProductResponse(product: any): ProductResponseDto {
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      discountPercentage: product.discountPercentage,
      rating: product.rating,
      stock: product.stock,
      brand: product.brand,
      sku: product.sku,
      weight: product.weight,
      dimensions: product.dimensions,
      warrantyInformation: product.warrantyInformation,
      shippingInformation: product.shippingInformation,
      availabilityStatus: product.availabilityStatus,
      reviews: product.reviews,
      returnPolicy: product.returnPolicy,
      minimumOrderQuantity: product.minimumOrderQuantity,
      images: product.images,
      thumbnail: product.thumbnail,
      tags: product.tags,
      externalId: product.externalId,
      lastSyncAt: product.lastSyncAt,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      category: product.category,
    };
  }

  private capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
