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
    console.log('Getting products:', params);
    
    // Actualizar estado de loading
    this.productsState.next({
      ...this.productsState.value,
      loading: true,
      error: null
    });

    let httpParams = new HttpParams();
    let url = `${this.apiUrl}/products`;
    
    // Determinar qué endpoint usar
    if (params?.search && !params?.category) {
      // Búsqueda sin categoría - usar endpoint de búsqueda
      url = `${this.apiUrl}/products/search`;
      httpParams = httpParams.append('q', params.search);
    } else if (params?.category) {
      // Categoría específica - usar endpoint de categoría
      url = `${this.apiUrl}/products/category/${params.category}`;
    }
    
    // Configurar parámetros de DummyJSON
    if (params?.limit) httpParams = httpParams.append('limit', params.limit.toString());
    if (params?.skip) httpParams = httpParams.append('skip', params.skip.toString());

    return this.http.get<any>(url, { params: httpParams }).pipe(
      map((response: any) => {
        console.log('DummyJSON response:', response);
        
        let products = response.products || [];
        
        // Aplicar búsqueda si hay término y categoría (filtrado manual)
        if (params?.search && params?.category) {
          const searchTerm = params.search.toLowerCase();
          products = products.filter((product: any) => 
            product.title.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
          );
        }
        
        // Aplicar ordenamiento si está especificado
        if (params?.sortBy && params?.sortOrder) {
          products = this.sortProducts(products, params.sortBy, params.sortOrder);
        }

        const mappedResponse: PaginatedProductsResponse = {
          products: products,
          total: response.total || products.length,
          limit: response.limit || 30,
          skip: response.skip || 0
        };

        // Actualizar estado
        this.productsState.next({
          ...this.productsState.value,
          products: mappedResponse.products,
          loading: false,
          error: null,
          total: mappedResponse.total,
          hasMore: (mappedResponse.skip + mappedResponse.limit) < mappedResponse.total
        });

        return mappedResponse;
      }),
      catchError(error => {
        console.error('Error fetching products:', error);
        this.productsState.next({
          ...this.productsState.value,
          loading: false,
          error: 'Error al cargar productos'
        });
        return throwError(() => error);
      })
    );
  }

  getProductById(id: number): Observable<Product> {
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

  getCategories(): Observable<Category[]> {
    return this.http.get<string[]>(`${this.apiUrl}/products/categories`).pipe(
      map(categories => categories.map((category, index) => ({
        id: (index + 1).toString(),
        slug: category,
        name: category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')
      })))
    );
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

  private sortProducts(products: any[], sortBy: string, order: 'asc' | 'desc'): any[] {
    return products.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }
}