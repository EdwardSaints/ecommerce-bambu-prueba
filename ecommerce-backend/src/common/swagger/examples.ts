// Ejemplos de respuestas para Swagger

export const SwaggerExamples = {
  // Respuestas de error comunes
  BadRequest: {
    statusCode: 400,
    error: 'Bad Request',
    message: ['email must be a valid email', 'password must be longer than or equal to 6 characters'],
    timestamp: '2024-01-01T00:00:00.000Z',
    path: '/api/auth/register'
  },

  Unauthorized: {
    statusCode: 401,
    error: 'Unauthorized',
    message: 'Token inválido o expirado',
    timestamp: '2024-01-01T00:00:00.000Z',
    path: '/api/auth/profile'
  },

  Forbidden: {
    statusCode: 403,
    error: 'Forbidden',
    message: 'No tienes permisos para acceder a este recurso',
    timestamp: '2024-01-01T00:00:00.000Z',
    path: '/api/products/sync'
  },

  NotFound: {
    statusCode: 404,
    error: 'Not Found',
    message: 'El recurso solicitado no fue encontrado',
    timestamp: '2024-01-01T00:00:00.000Z',
    path: '/api/products/invalid-id'
  },

  Conflict: {
    statusCode: 409,
    error: 'Conflict',
    message: 'El email ya está registrado',
    timestamp: '2024-01-01T00:00:00.000Z',
    path: '/api/auth/register'
  },

  InternalServerError: {
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'Ha ocurrido un error interno del servidor',
    timestamp: '2024-01-01T00:00:00.000Z',
    path: '/api/products/sync'
  },

  // Ejemplos de respuestas exitosas
  AuthResponse: {
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    tokenType: 'Bearer',
    expiresIn: 604800,
    user: {
      id: 'clxxx123456789',
      email: 'usuario@ejemplo.com',
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '+34123456789',
      address: 'Calle Principal 123',
      role: 'CUSTOMER',
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z'
    }
  },

  UserProfile: {
    id: 'clxxx123456789',
    email: 'usuario@ejemplo.com',
    firstName: 'Juan',
    lastName: 'Pérez',
    phone: '+34123456789',
    address: 'Calle Principal 123',
    role: 'CUSTOMER',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z'
  },

  Product: {
    id: 'clxxx123456789',
    title: 'iPhone 15 Pro',
    description: 'El iPhone más avanzado con chip A17 Pro',
    price: 999.99,
    discountPercentage: 10.5,
    rating: 4.8,
    stock: 50,
    brand: 'Apple',
    sku: 'IPH15PRO256',
    weight: 0.187,
    dimensions: {
      width: 70.6,
      height: 146.6,
      depth: 8.25
    },
    warrantyInformation: '1 año de garantía',
    shippingInformation: 'Envío gratis en 24h',
    availabilityStatus: 'In Stock',
    returnPolicy: '30 días de devolución',
    minimumOrderQuantity: 1,
    images: [
      'https://example.com/iphone15pro-1.jpg',
      'https://example.com/iphone15pro-2.jpg'
    ],
    thumbnail: 'https://example.com/iphone15pro-thumb.jpg',
    tags: ['smartphone', 'apple', 'premium'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    category: {
      id: 'clyyy987654321',
      name: 'Smartphones',
      slug: 'smartphones'
    }
  },

  ProductsList: {
    products: [
      // Producto ejemplo (igual que arriba)
    ],
    pagination: {
      total: 194,
      page: 1,
      limit: 10,
      totalPages: 20,
      hasNext: true,
      hasPrev: false
    }
  },

  Category: {
    id: 'clyyy987654321',
    name: 'Smartphones',
    slug: 'smartphones',
    description: 'Productos de Smartphones',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    productCount: 25
  },

  Cart: {
    id: 'clzzz111222333',
    userId: 'clxxx123456789',
    items: [
      {
        id: 'claaa444555666',
        quantity: 2,
        unitPrice: 999.99,
        totalPrice: 1999.98,
        addedAt: '2024-01-01T00:00:00.000Z',
        product: {
          id: 'clxxx123456789',
          title: 'iPhone 15 Pro',
          thumbnail: 'https://example.com/iphone15pro-thumb.jpg',
          stock: 50,
          category: {
            id: 'clyyy987654321',
            name: 'Smartphones',
            slug: 'smartphones'
          }
        }
      }
    ],
    totalItems: 2,
    totalAmount: 1999.98,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },

  TasksStatus: {
    syncProductsRunning: false,
    nextSyncTime: '2024-01-01T12:00:00.000Z',
    timezone: 'America/Mexico_City',
    cronExpression: '0 */12 * * *'
  },

  SyncResult: {
    message: 'Sincronización completada',
    synchronized: 194,
    errors: 0
  }
};
