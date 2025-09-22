import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

// PrimeNG Imports
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';

import { ProductsService } from '../../../../core/services/products.service';
import { CartService } from '../../../../core/services/cart.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Product } from '../../../../core/interfaces/product.interface';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule,
    CarouselModule,
    ButtonModule,
    TagModule,
    InputTextModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private productsService = inject(ProductsService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);

  // Exponer Math para el template
  Math = Math;

  // Observables
  featuredProducts$: Observable<Product[]> = this.productsService.productsState$.pipe(
    map(state => state.products.slice(0, 8)) // Mostrar 8 productos para el carrusel
  );

  loading$: Observable<boolean> = this.productsService.productsState$.pipe(
    map(state => state.loading)
  );

  isAuthenticated$ = this.authService.isAuthenticated$;

  // Search
  searchQuery = '';

  // Carousel configuration
  carouselResponsiveOptions = [
    {
      breakpoint: '1400px',
      numVisible: 4,
      numScroll: 1
    },
    {
      breakpoint: '1024px',
      numVisible: 3,
      numScroll: 1
    },
    {
      breakpoint: '768px',
      numVisible: 2,
      numScroll: 1
    },
    {
      breakpoint: '640px',
      numVisible: 1,
      numScroll: 1
    }
  ];

  ngOnInit(): void {
    // Cargar productos destacados
    this.productsService.getProducts({ limit: 8 }).pipe(take(1))      .subscribe();
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      // Navegar a la página de productos con búsqueda
      window.location.href = `/products?search=${encodeURIComponent(this.searchQuery.trim())}`;
    }
  }

  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSearch();
    }
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

  addToCart(product: Product): void {
    this.cartService.addToCart(product, 1).subscribe();
  }

  getSeverity(product: Product): string {
    if (product.stock === 0) return 'danger';
    if (product.stock < 10) return 'warning';
    return 'success';
  }

  getStockLabel(product: Product): string {
    if (product.stock === 0) return 'Agotado';
    if (product.stock < 10) return 'Pocas unidades';
    return 'Disponible';
  }

  onImageError(event: any): void {
    event.target.src = 'https://via.placeholder.com/300x200?text=Imagen+no+disponible';
  }
}
