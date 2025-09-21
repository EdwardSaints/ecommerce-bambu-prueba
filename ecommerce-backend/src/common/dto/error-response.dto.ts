import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Código de estado HTTP',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensaje de error principal',
    example: 'Bad Request',
  })
  error: string;

  @ApiProperty({
    description: 'Descripción detallada del error',
    example: 'Los datos proporcionados no son válidos',
  })
  message: string | string[];

  @ApiProperty({
    description: 'Timestamp del error',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Ruta donde ocurrió el error',
    example: '/api/auth/login',
  })
  path: string;
}

export class ValidationErrorResponseDto {
  @ApiProperty({
    description: 'Código de estado HTTP',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensaje de error principal',
    example: 'Bad Request',
  })
  error: string;

  @ApiProperty({
    description: 'Lista de errores de validación específicos',
    example: [
      'email must be a valid email',
      'password must be longer than or equal to 6 characters'
    ],
  })
  message: string[];

  @ApiProperty({
    description: 'Timestamp del error',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Ruta donde ocurrió el error',
    example: '/api/auth/login',
  })
  path: string;
}

export class UnauthorizedErrorResponseDto {
  @ApiProperty({
    description: 'Código de estado HTTP',
    example: 401,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensaje de error',
    example: 'Unauthorized',
  })
  error: string;

  @ApiProperty({
    description: 'Descripción del error de autorización',
    example: 'Token inválido o expirado',
  })
  message: string;
}

export class ForbiddenErrorResponseDto {
  @ApiProperty({
    description: 'Código de estado HTTP',
    example: 403,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensaje de error',
    example: 'Forbidden',
  })
  error: string;

  @ApiProperty({
    description: 'Descripción del error de permisos',
    example: 'No tienes permisos para acceder a este recurso',
  })
  message: string;
}

export class NotFoundErrorResponseDto {
  @ApiProperty({
    description: 'Código de estado HTTP',
    example: 404,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensaje de error',
    example: 'Not Found',
  })
  error: string;

  @ApiProperty({
    description: 'Descripción del recurso no encontrado',
    example: 'El recurso solicitado no fue encontrado',
  })
  message: string;
}

export class ConflictErrorResponseDto {
  @ApiProperty({
    description: 'Código de estado HTTP',
    example: 409,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensaje de error',
    example: 'Conflict',
  })
  error: string;

  @ApiProperty({
    description: 'Descripción del conflicto',
    example: 'El email ya está registrado',
  })
  message: string;
}

export class InternalServerErrorResponseDto {
  @ApiProperty({
    description: 'Código de estado HTTP',
    example: 500,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensaje de error',
    example: 'Internal Server Error',
  })
  error: string;

  @ApiProperty({
    description: 'Descripción del error interno',
    example: 'Ha ocurrido un error interno del servidor',
  })
  message: string;
}
