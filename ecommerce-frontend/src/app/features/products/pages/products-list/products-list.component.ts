import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { ProductsService } from '../../../../core/services/products.service';
import { CartService } from '../../../../core/services/cart.service';
import { Product, ProductQueryParams, Category } from '../../../../core/interfaces/product.interface';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.scss'
})
export class ProductsListComponent implements OnInit {
  private productsService = inject(ProductsService);
  private cartService = inject(CartService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Observables del estado
  products$: Observable<Product[]> = this.productsService.productsState$.pipe(
    map(state => state.products)
  );
  loading$: Observable<boolean> = this.productsService.productsState$.pipe(
    map(state => state.loading)
  );
  error$: Observable<string | null> = this.productsService.productsState$.pipe(
    map(state => state.error)
  );
  hasMore$: Observable<boolean> = this.productsService.productsState$.pipe(
    map(state => state.hasMore)
  );
  total$: Observable<number> = this.productsService.productsState$.pipe(
    map(state => state.total)
  );

  // Parámetros de búsqueda
  searchTerm = '';
  selectedCategory = '';
  currentSort = '';
  currentPage = 1;
  itemsPerPage = 12;
  totalPages = 1;
  
  // Data
  products: Product[] = [];
  categories: Category[] = [];
  loading = false;
  
  // Sort options
  sortOptions = [
    { label: 'Relevancia', value: '' },
    { label: 'Precio: Menor a Mayor', value: 'price-asc' },
    { label: 'Precio: Mayor a Menor', value: 'price-desc' },
    { label: 'Mejor Calificados', value: 'rating-desc' }
  ];

  ngOnInit(): void {
    // Leer parámetros de la URL
    this.route.queryParams.subscribe(params => {
      this.searchTerm = params['search'] || '';
      this.selectedCategory = params['category'] || '';
      this.currentSort = params['sort'] || '';
      this.currentPage = parseInt(params['page']) || 1;
      
      this.loadProducts();
    });
    
    this.loadCategories();
    
    // Setup search debounce
    this.setupSearchDebounce();
  }

  private setupSearchDebounce(): void {
    const searchSubject = new Subject<string>();
    
    searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1;
      this.updateUrlAndLoadProducts();
    });
    
    // You can use this subject for real-time search if needed
  }

  loadProducts(): void {
    this.loading = true;
    
    const params: ProductQueryParams = {
      limit: this.itemsPerPage,
      skip: (this.currentPage - 1) * this.itemsPerPage,
      search: this.searchTerm || undefined,
      category: this.selectedCategory || undefined,
      sortBy: this.currentSort ? this.getSortField() : undefined,
      sortOrder: this.currentSort ? this.getSortOrder() : undefined
    };

    console.log('Loading products with params:', params);

    // Siempre usar getProducts - maneja búsqueda, categorías y ordenamiento
    this.productsService.getProducts(params).subscribe({
      next: (response) => {
        console.log('Products loaded:', response);
        this.products = response.products;
        this.totalPages = Math.ceil(response.total / this.itemsPerPage);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.loading = false;
      }
    });
  }

  loadCategories(): void {
    this.productsService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.updateUrlAndLoadProducts();
  }

  onCategoryChange(): void {
    console.log('Category changed to:', this.selectedCategory);
    this.currentPage = 1;
    this.updateUrlAndLoadProducts();
  }

  onSortChange(sortValue: string): void {
    console.log('Sort changed to:', sortValue);
    this.currentSort = sortValue;
    this.currentPage = 1;
    this.updateUrlAndLoadProducts();
  }

  private updateUrlAndLoadProducts(): void {
    const queryParams: any = {};
    
    if (this.searchTerm) queryParams.search = this.searchTerm;
    if (this.selectedCategory) queryParams.category = this.selectedCategory;
    if (this.currentSort) queryParams.sort = this.currentSort;
    if (this.currentPage > 1) queryParams.page = this.currentPage;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateUrlAndLoadProducts();
    }
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (this.currentPage > 3) {
        pages.push('...');
      }
      
      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(this.totalPages - 1, this.currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (this.currentPage < this.totalPages - 2) {
        pages.push('...');
      }
      
      pages.push(this.totalPages);
    }
    
    return pages;
  }

  viewProduct(productId: number): void {
    // Navigation handled by routerLink in template
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product, 1).subscribe();
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  getDiscountedPrice(price: number, discountPercentage: number): number {
    return price * (1 - discountPercentage / 100);
  }

  onImageError(event: any): void {
    event.target.src = 'https://via.placeholder.com/300x200?text=Imagen+no+disponible';
  }

  private getSortField(): string {
    switch (this.currentSort) {
      case 'price-asc':
      case 'price-desc':
        return 'price';
      case 'rating-desc':
        return 'rating';
      default:
        return 'title';
    }
  }

  private getSortOrder(): 'asc' | 'desc' {
    switch (this.currentSort) {
      case 'price-asc':
        return 'asc';
      case 'price-desc':
      case 'rating-desc':
        return 'desc';
      default:
        return 'asc';
    }
  }
}