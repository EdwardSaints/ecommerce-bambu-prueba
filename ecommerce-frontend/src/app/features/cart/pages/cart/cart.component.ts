import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Carrito de Compras</h1>
      <div class="text-center py-12">
        <i class="pi pi-shopping-cart text-6xl text-gray-400 mb-4"></i>
        <h2 class="text-xl font-semibold text-gray-700 mb-2">Tu carrito está vacío</h2>
        <p class="text-gray-600 mb-6">Agrega algunos productos para comenzar a comprar.</p>
        <button routerLink="/products" class="btn-primary">
          Explorar Productos
        </button>
      </div>
    </div>
  `
})
export class CartComponent {}
