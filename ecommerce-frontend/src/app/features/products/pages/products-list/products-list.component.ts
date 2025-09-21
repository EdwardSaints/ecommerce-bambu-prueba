import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ProductsService } from '../../../../core/services/products.service';
import { Product, ProductQueryParams } from '../../../../core/interfaces/product.interface';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.scss'
})
export class ProductsListComponent implements OnInit {
  private productsService = inject(ProductsService);

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
  searchQuery = '';
  currentPage = 1;
  itemsPerPage = 12;
  categories: string[] = [];

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts(reset: boolean = true): void {
    const params: ProductQueryParams = {
      limit: this.itemsPerPage,
      skip: reset ? 0 : (this.currentPage - 1) * this.itemsPerPage,
      search: this.searchQuery || undefined
    };

    if (reset) {
      this.currentPage = 1;
    }

    this.productsService.getProducts(params).subscribe({
      next: (response) => {
        console.log('✅ Productos cargados:', response);
      },
      error: (error) => {
        console.error('❌ Error al cargar productos:', error);
      }
    });
  }

  loadCategories(): void {
    this.productsService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        console.log('✅ Categorías cargadas:', categories);
      },
      error: (error) => {
        console.error('❌ Error al cargar categorías:', error);
      }
    });
  }

  onSearch(): void {
    console.log('🔍 Buscando:', this.searchQuery);
    this.loadProducts(true);
  }

  onLoadMore(): void {
    this.currentPage++;
    this.loadProducts(false);
  }

  onClearSearch(): void {
    this.searchQuery = '';
    this.loadProducts(true);
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
}