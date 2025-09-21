import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({
    description: 'ID único de la categoría',
    example: 'clxxx123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre de la categoría',
    example: 'Smartphones',
  })
  name: string;

  @ApiProperty({
    description: 'Slug de la categoría',
    example: 'smartphones',
  })
  slug: string;

  @ApiProperty({
    description: 'Descripción de la categoría',
    example: 'Dispositivos móviles inteligentes',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Estado activo de la categoría',
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
    description: 'Número de productos en la categoría',
    example: 25,
    required: false,
  })
  productCount?: number;
}
