import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

import { ProductsService } from '../../../../core/services/products.service';
import { CartService } from '../../../../core/services/cart.service';
import { Product, ProductReview } from '../../../../core/interfaces/product.interface';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productsService = inject(ProductsService);
  private cartService = inject(CartService);

  product: Product | null = null;
  loading = false;
  selectedImage = '';
  quantity = 1;
  addingToCart = false;
  inWishlist = false;

  ngOnInit(): void {
    this.route.params.pipe(
      switchMap(params => {
        const productId = +params['id'];
        if (productId) {
          this.loading = true;
          return this.productsService.getProductById(productId);
        }
        return of(null);
      }),
      catchError(error => {
        console.error('Error loading product:', error);
        this.loading = false;
        return of(null);
      })
    ).subscribe(product => {
      this.product = product;
      this.loading = false;
      if (product && product.images && product.images.length > 0) {
        this.selectedImage = product.images[0];
      } else if (product) {
        this.selectedImage = product.thumbnail;
      }
    });
  }

  selectImage(image: string): void {
    this.selectedImage = image;
  }

  increaseQuantity(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  validateQuantity(): void {
    if (!this.product) return;
    
    if (this.quantity < 1) {
      this.quantity = 1;
    } else if (this.quantity > this.product.stock) {
      this.quantity = this.product.stock;
    }
  }

  addToCart(): void {
    if (!this.product) return;
    
    this.addingToCart = true;
    this.cartService.addToCart(this.product, this.quantity).subscribe({
      next: (success) => {
        this.addingToCart = false;
        if (success) {
          this.quantity = 1; // Reset quantity after successful add
        }
      },
      error: () => {
        this.addingToCart = false;
      }
    });
  }

  toggleWishlist(): void {
    this.inWishlist = !this.inWishlist;
    // TODO: Implement wishlist functionality
  }

  getOriginalPrice(): string {
    if (!this.product) return '0';
    const originalPrice = this.product.price / (1 - this.product.discountPercentage / 100);
    return originalPrice.toFixed(2);
  }

  getSavings(): string {
    if (!this.product) return '0';
    const originalPrice = parseFloat(this.getOriginalPrice());
    const savings = originalPrice - this.product.price;
    return savings.toFixed(2);
  }

  getStars(rating: number): boolean[] {
    const stars: boolean[] = [];
    const fullStars = Math.floor(rating);
    
    for (let i = 0; i < 5; i++) {
      stars.push(i < fullStars);
    }
    
    return stars;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  onImageError(event: any): void {
    event.target.src = 'https://via.placeholder.com/400x400?text=Imagen+no+disponible';
  }
}