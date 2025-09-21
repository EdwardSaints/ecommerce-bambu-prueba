import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface DummyJSONProduct {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand?: string;
  sku: string;
  weight: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: Array<{
    rating: number;
    comment: string;
    date: string;
    reviewerName: string;
    reviewerEmail: string;
  }>;
  returnPolicy: string;
  minimumOrderQuantity: number;
  meta: {
    createdAt: string;
    updatedAt: string;
    barcode: string;
    qrCode: string;
  };
  images: string[];
  thumbnail: string;
}

export interface DummyJSONResponse {
  products: DummyJSONProduct[];
  total: number;
  skip: number;
  limit: number;
}

export interface DummyJSONCategories {
  slug: string;
  name: string;
  url: string;
}

@Injectable()
export class DummyjsonService {
  private readonly logger = new Logger(DummyjsonService.name);
  private readonly httpClient: AxiosInstance;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('DUMMYJSON_API_URL', 'https://dummyjson.com');
    
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para logs
    this.httpClient.interceptors.request.use(
      (config) => {
        this.logger.log(`Making request to: ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error(`Request error: ${error.message}`);
        return Promise.reject(error);
      }
    );

    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.log(`Response received from: ${response.config.url}`);
        return response;
      },
      (error) => {
        this.logger.error(`Response error: ${error.message}`);
        return Promise.reject(error);
      }
    );
  }

  async getAllProducts(limit = 100, skip = 0): Promise<DummyJSONResponse> {
    try {
      const response = await this.httpClient.get<DummyJSONResponse>('/products', {
        params: { limit, skip }
      });
      
      this.logger.log(`Fetched ${response.data.products.length} products from DummyJSON`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching products: ${error.message}`);
      throw new Error(`Failed to fetch products from DummyJSON: ${error.message}`);
    }
  }

  async getProductById(id: number): Promise<DummyJSONProduct> {
    try {
      const response = await this.httpClient.get<DummyJSONProduct>(`/products/${id}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching product ${id}: ${error.message}`);
      throw new Error(`Failed to fetch product ${id} from DummyJSON: ${error.message}`);
    }
  }

  async getCategories(): Promise<DummyJSONCategories[]> {
    try {
      const response = await this.httpClient.get<DummyJSONCategories[]>('/products/categories');
      this.logger.log(`Fetched ${response.data.length} categories from DummyJSON`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching categories: ${error.message}`);
      throw new Error(`Failed to fetch categories from DummyJSON: ${error.message}`);
    }
  }

  async getProductsByCategory(category: string, limit = 30): Promise<DummyJSONResponse> {
    try {
      const response = await this.httpClient.get<DummyJSONResponse>(`/products/category/${category}`, {
        params: { limit }
      });
      
      this.logger.log(`Fetched ${response.data.products.length} products from category: ${category}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching products from category ${category}: ${error.message}`);
      throw new Error(`Failed to fetch products from category ${category}: ${error.message}`);
    }
  }

  async searchProducts(query: string, limit = 30): Promise<DummyJSONResponse> {
    try {
      const response = await this.httpClient.get<DummyJSONResponse>('/products/search', {
        params: { q: query, limit }
      });
      
      this.logger.log(`Found ${response.data.products.length} products for query: ${query}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error searching products with query ${query}: ${error.message}`);
      throw new Error(`Failed to search products: ${error.message}`);
    }
  }
}
