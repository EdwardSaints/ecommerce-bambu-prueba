import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CartService } from '../../../../core/services/cart.service';
import { CartItem, Cart } from '../../../../core/interfaces/cart.interface';
import { Product } from '../../../../core/interfaces/product.interface';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {
  private cartService = inject(CartService);

  cart$: Observable<Cart> = this.cartService.cart$;
  cartItems: CartItem[] = [];
  loading = false;
  
  // Loading states for individual operations
  updatingItems = new Set<number>();
  removingItems = new Set<number>();
  clearingCart = false;
  processingCheckout = false;
  
  // Recently viewed products (mock data for now)
  recentlyViewed: Product[] = [];

  ngOnInit(): void {
    this.cart$.subscribe(cart => {
      this.cartItems = cart.items;
    });
    
    // Load recently viewed products (mock)
    this.loadRecentlyViewed();
  }

  updateQuantity(productId: number, newQuantity: number): void {
    this.updatingItems.add(productId);
    
    this.cartService.updateQuantity(productId, newQuantity).subscribe({
      next: () => {
        this.updatingItems.delete(productId);
      },
      error: () => {
        this.updatingItems.delete(productId);
      }
    });
  }

  removeFromCart(productId: number): void {
    this.removingItems.add(productId);
    
    this.cartService.removeFromCart(productId).subscribe({
      next: () => {
        this.removingItems.delete(productId);
      },
      error: () => {
        this.removingItems.delete(productId);
      }
    });
  }

  clearCart(): void {
    this.clearingCart = true;
    
    this.cartService.clearCart().subscribe({
      next: () => {
        this.clearingCart = false;
      },
      error: () => {
        this.clearingCart = false;
      }
    });
  }

  proceedToCheckout(): void {
    this.processingCheckout = true;
    
    this.cartService.proceedToCheckout().subscribe({
      next: () => {
        this.processingCheckout = false;
      },
      error: () => {
        this.processingCheckout = false;
      }
    });
  }

  addToCartFromRecent(product: Product): void {
    this.cartService.addToCart(product, 1).subscribe();
  }

  // Utility methods
  trackByProductId(index: number, item: CartItem): number {
    return item.product.id;
  }

  getItemTotal(item: CartItem): string {
    const total = item.product.price * item.quantity;
    return total.toFixed(2);
  }

  getOriginalPrice(product: Product): string {
    if (product.discountPercentage === 0) return product.price.toFixed(2);
    const originalPrice = product.price / (1 - product.discountPercentage / 100);
    return originalPrice.toFixed(2);
  }

  getTotalItems(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  getSubtotal(): number {
    const subtotal = this.cartItems.reduce((sum, item) => {
      const originalPrice = parseFloat(this.getOriginalPrice(item.product));
      return sum + (originalPrice * item.quantity);
    }, 0);
    return Math.round(subtotal * 100) / 100;
  }

  getTotalDiscount(): string {
    const discount = this.cartItems.reduce((sum, item) => {
      const originalPrice = parseFloat(this.getOriginalPrice(item.product));
      const discountAmount = (originalPrice - item.product.price) * item.quantity;
      return sum + discountAmount;
    }, 0);
    return discount.toFixed(2);
  }

  getTotal(): string {
    const subtotal = this.getSubtotal();
    const shipping = subtotal >= 50 ? 0 : 5.99;
    const total = this.cartItems.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0) + shipping;
    return total.toFixed(2);
  }

  onImageError(event: any): void {
    event.target.src = 'https://via.placeholder.com/80x80?text=Imagen+no+disponible';
  }

  private loadRecentlyViewed(): void {
    // Mock recently viewed products
    this.recentlyViewed = [
      {
        id: 101,
        title: 'Producto Visto 1',
        price: 29.99,
        thumbnail: 'https://cdn.dummyjson.com/products/images/smartphones/iPhone%209/thumbnail.jpg',
        description: 'Producto que viste recientemente',
        discountPercentage: 0,
        rating: 4.5,
        stock: 10,
        brand: 'Brand',
        category: 'electronics',
        images: []
      },
      {
        id: 102,
        title: 'Producto Visto 2',
        price: 49.99,
        thumbnail: 'https://cdn.dummyjson.com/products/images/laptops/MacBook%20Pro/thumbnail.jpg',
        description: 'Otro producto que viste',
        discountPercentage: 10,
        rating: 4.8,
        stock: 5,
        brand: 'Brand',
        category: 'electronics',
        images: []
      }
    ];
  }
}