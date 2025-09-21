export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  category: string;
  thumbnail: string;
  images: string[];
  tags?: string[];
  sku?: string;
  weight?: number;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  warrantyInformation?: string;
  shippingInformation?: string;
  availabilityStatus?: string;
  reviews?: ProductReview[];
  returnPolicy?: string;
  minimumOrderQuantity?: number;
}

export interface ProductReview {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  sortBy?: 'title' | 'price' | 'rating';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  skip?: number;
}

export interface ProductsState {
  products: Product[];
  categories: string[];
  loading: boolean;
  error: string | null;
  filters: ProductFilters;
  total: number;
  hasMore: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productCount?: number;
}

export interface PaginatedProductsResponse {
  products: Product[];
  total: number;
  limit: number;
  skip: number;
}

export interface ProductQueryParams {
  limit?: number;
  skip?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  minRating?: number;
  maxRating?: number;
  minStock?: number;
  maxStock?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
