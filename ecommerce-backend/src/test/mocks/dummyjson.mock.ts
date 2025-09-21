export const mockDummyjsonService = {
  getAllProducts: jest.fn(),
  getProductById: jest.fn(),
  getCategories: jest.fn(),
  getProductsByCategory: jest.fn(),
  searchProducts: jest.fn(),
};

export const mockDummyJSONProduct = {
  id: 1,
  title: 'iPhone 15 Pro',
  description: 'El iPhone más avanzado',
  category: 'smartphones',
  price: 999.99,
  discountPercentage: 10.5,
  rating: 4.8,
  stock: 50,
  tags: ['smartphone', 'apple'],
  brand: 'Apple',
  sku: 'IPH15PRO256',
  weight: 0.187,
  dimensions: {
    width: 70.6,
    height: 146.6,
    depth: 8.25,
  },
  warrantyInformation: '1 año de garantía',
  shippingInformation: 'Envío gratis en 24h',
  availabilityStatus: 'In Stock',
  reviews: [],
  returnPolicy: '30 días de devolución',
  minimumOrderQuantity: 1,
  meta: {
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    barcode: '123456789',
    qrCode: 'qr-code-url',
  },
  images: ['https://example.com/image1.jpg'],
  thumbnail: 'https://example.com/thumb.jpg',
};

export const mockDummyJSONResponse = {
  products: [mockDummyJSONProduct],
  total: 1,
  skip: 0,
  limit: 30,
};

export const mockDummyJSONCategories = [
  { slug: 'smartphones', name: 'Smartphones', url: 'https://dummyjson.com/products/category/smartphones' },
  { slug: 'laptops', name: 'Laptops', url: 'https://dummyjson.com/products/category/laptops' },
];
