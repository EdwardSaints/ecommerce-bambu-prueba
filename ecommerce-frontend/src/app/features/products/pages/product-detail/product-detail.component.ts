import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Detalle del Producto</h1>
      <div class="text-center py-12">
        <i class="pi pi-info-circle text-6xl text-gray-400 mb-4"></i>
        <h2 class="text-xl font-semibold text-gray-700 mb-2">Próximamente</h2>
        <p class="text-gray-600">Esta página estará disponible pronto.</p>
      </div>
    </div>
  `
})
export class ProductDetailComponent {}
