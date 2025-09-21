import { ApiProperty } from '@nestjs/swagger';

export class CartItemResponseDto {
  @ApiProperty({
    description: 'ID único del item en el carrito',
    example: 'clxxx123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Cantidad del producto en el carrito',
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    description: 'Precio unitario del producto',
    example: 999.99,
  })
  unitPrice: number;

  @ApiProperty({
    description: 'Precio total del item (cantidad × precio unitario)',
    example: 1999.98,
  })
  totalPrice: number;

  @ApiProperty({
    description: 'Fecha de agregado al carrito',
    example: '2024-01-01T00:00:00.000Z',
  })
  addedAt: Date;

  @ApiProperty({
    description: 'Información del producto',
    example: {
      id: 'clxxx123456789',
      title: 'iPhone 15 Pro',
      thumbnail: 'https://example.com/image.jpg',
      stock: 50,
      category: {
        id: 'clyyy987654321',
        name: 'Smartphones',
        slug: 'smartphones'
      }
    },
  })
  product: {
    id: string;
    title: string;
    thumbnail: string;
    stock: number;
    category: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

export class CartResponseDto {
  @ApiProperty({
    description: 'ID único del carrito',
    example: 'clxxx123456789',
  })
  id: string;

  @ApiProperty({
    description: 'ID del usuario propietario del carrito',
    example: 'clyyy987654321',
  })
  userId: string;

  @ApiProperty({
    description: 'Lista de items en el carrito',
    type: [CartItemResponseDto],
  })
  items: CartItemResponseDto[];

  @ApiProperty({
    description: 'Número total de items en el carrito',
    example: 3,
  })
  totalItems: number;

  @ApiProperty({
    description: 'Precio total del carrito',
    example: 2999.97,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Fecha de creación del carrito',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
