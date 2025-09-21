import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { ProductsService } from '../../../../core/services/products.service';
import { Product } from '../../../../core/interfaces/product.interface';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private productsService = inject(ProductsService);

  featuredProducts$: Observable<Product[]> = this.productsService.productsState$.pipe(
    map(state => state.products.slice(0, 6)) // Mostrar solo los primeros 6 productos
  );

  loading$: Observable<boolean> = this.productsService.productsState$.pipe(
    map(state => state.loading)
  );

  ngOnInit(): void {
    // Cargar productos destacados
    this.productsService.getProducts({ limit: 6 }).pipe(take(1)).subscribe({
      next: (response) => {
        console.log('✅ Productos destacados cargados:', response);
      },
      error: (error) => {
        console.error('❌ Error al cargar productos destacados:', error);
      }
    });
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
