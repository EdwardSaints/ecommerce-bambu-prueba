import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Category, PaginatedProductsResponse, Product, ProductQueryParams } from '../interfaces/product.interface';
import { LoadingService } from './loading.service';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private http = inject(HttpClient);
  private loadingService = inject(LoadingService);

  private apiUrl = environment.dummyJsonApiUrl;

  // Estado centralizado de productos
  private productsState = new BehaviorSubject<{
    products: Product[];
    categories: string[];
    loading: boolean;
    error: string | null;
    total: number;
    hasMore: boolean;
  }>({
    products: [],
    categories: [],
    loading: false,
    error: null,
    total: 0,
    hasMore: true
  });

  public productsState$ = this.productsState.asObservable();
  public loading$ = this.productsState$.pipe(map(state => state.loading));

  getProducts(params?: ProductQueryParams): Observable<PaginatedProductsResponse> {
    console.log('🛍️ Obteniendo productos:', params);
    
    // Actualizar estado de loading
    this.productsState.next({
      ...this.productsState.value,
      loading: true,
      error: null
    });

    let httpParams = new HttpParams();
    
    // Configurar parámetros de DummyJSON
    if (params?.limit) httpParams = httpParams.append('limit', params.limit.toString());
    if (params?.skip) httpParams = httpParams.append('skip', params.skip.toString());

    return this.http.get<any>(`${this.apiUrl}/products`, { params: httpParams }).pipe(
      map((response: any) => {
        console.log('🛍️ Respuesta de DummyJSON:', response);
        
        const mappedResponse: PaginatedProductsResponse = {
          products: response.products || [],
          total: response.total || 0,
          limit: response.limit || 30,
          skip: response.skip || 0
        };

        // Actualizar estado
        this.productsState.next({
          ...this.productsState.value,
          products: params?.skip && params.skip > 0 
            ? [...this.productsState.value.products, ...mappedResponse.products] 
            : mappedResponse.products,
          loading: false,
          error: null,
          total: mappedResponse.total,
          hasMore: (mappedResponse.skip + mappedResponse.limit) < mappedResponse.total
        });

        return mappedResponse;
      }),
      catchError(error => {
        console.error('❌ Error fetching products:', error);
        this.productsState.next({
          ...this.productsState.value,
          loading: false,
          error: 'Error al cargar productos'
        });
        return throwError(() => error);
      })
    );
  }

  getProductById(id: string): Observable<Product> {
    this.loadingService.setLoading('product-detail', true);
    
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`).pipe(
      map(product => {
        this.loadingService.setLoading('product-detail', false);
        return product;
      }),
      catchError(error => {
        this.loadingService.setLoading('product-detail', false);
        throw error;
      })
    );
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/products/categories`);
  }

  searchProducts(query: string, params?: ProductQueryParams): Observable<PaginatedProductsResponse> {
    this.loadingService.setLoading('products', true);
    
    let httpParams = new HttpParams().set('q', query);
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof ProductQueryParams];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.append(key, value.toString());
        }
      });
    }
    
    return this.http.get<any>(`${this.apiUrl}/products/search`, { params: httpParams }).pipe(
      map((response: any) => {
        this.loadingService.setLoading('products', false);
        return {
          products: response.products || [],
          total: response.total || 0,
          limit: response.limit || 30,
          skip: response.skip || 0
        } as PaginatedProductsResponse;
      }),
      catchError(error => {
        this.loadingService.setLoading('products', false);
        throw error;
      })
    );
  }
}