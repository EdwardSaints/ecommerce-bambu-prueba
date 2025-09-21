import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({
    description: 'ID único del producto',
    example: 'clxxx123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Título del producto',
    example: 'iPhone 15 Pro',
  })
  title: string;

  @ApiProperty({
    description: 'Descripción del producto',
    example: 'El iPhone más avanzado con chip A17 Pro',
  })
  description: string;

  @ApiProperty({
    description: 'Precio del producto',
    example: 999.99,
  })
  price: number;

  @ApiProperty({
    description: 'Porcentaje de descuento',
    example: 10.5,
  })
  discountPercentage: number;

  @ApiProperty({
    description: 'Calificación promedio',
    example: 4.5,
  })
  rating: number;

  @ApiProperty({
    description: 'Stock disponible',
    example: 50,
  })
  stock: number;

  @ApiProperty({
    description: 'Marca del producto',
    example: 'Apple',
    required: false,
  })
  brand?: string;

  @ApiProperty({
    description: 'SKU del producto',
    example: 'IPH15PRO256',
    required: false,
  })
  sku?: string;

  @ApiProperty({
    description: 'Peso del producto en gramos',
    example: 221,
    required: false,
  })
  weight?: number;

  @ApiProperty({
    description: 'Dimensiones del producto',
    example: { width: 76.7, height: 159.9, depth: 8.25 },
    required: false,
  })
  dimensions?: object;

  @ApiProperty({
    description: 'Información de garantía',
    example: '1 año de garantía limitada',
    required: false,
  })
  warrantyInformation?: string;

  @ApiProperty({
    description: 'Información de envío',
    example: 'Envío gratis en pedidos superiores a $50',
    required: false,
  })
  shippingInformation?: string;

  @ApiProperty({
    description: 'Estado de disponibilidad',
    example: 'In Stock',
  })
  availabilityStatus: string;

  @ApiProperty({
    description: 'Reseñas del producto',
    example: [{ rating: 5, comment: 'Excelente producto', reviewerName: 'Juan' }],
    required: false,
  })
  reviews?: object;

  @ApiProperty({
    description: 'Política de devolución',
    example: '30 días de devolución gratuita',
    required: false,
  })
  returnPolicy?: string;

  @ApiProperty({
    description: 'Cantidad mínima de pedido',
    example: 1,
  })
  minimumOrderQuantity: number;

  @ApiProperty({
    description: 'Imágenes del producto',
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  })
  images: string[];

  @ApiProperty({
    description: 'Imagen miniatura',
    example: 'https://example.com/thumbnail.jpg',
    required: false,
  })
  thumbnail?: string;

  @ApiProperty({
    description: 'Etiquetas del producto',
    example: ['smartphone', 'apple', 'premium'],
  })
  tags: string[];

  @ApiProperty({
    description: 'ID externo de DummyJSON',
    example: 123,
    required: false,
  })
  externalId?: number;

  @ApiProperty({
    description: 'Fecha de última sincronización',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  lastSyncAt?: Date;

  @ApiProperty({
    description: 'Estado activo del producto',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de actualización',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Información de la categoría',
    example: {
      id: 'clxxx123456789',
      name: 'Smartphones',
      slug: 'smartphones'
    },
  })
  category: {
    id: string;
    name: string;
    slug: string;
  };
}
