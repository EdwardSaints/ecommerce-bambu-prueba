import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { 
  Firestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  addDoc 
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { CartItem, Cart } from '../interfaces/cart.interface';
import { Product } from '../interfaces/product.interface';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartSubject = new BehaviorSubject<Cart>({
    items: [],
    total: 0,
    itemCount: 0
  });

  public cart$ = this.cartSubject.asObservable();
  private currentUserId: string | null = null;

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    // Suscribirse a cambios de autenticación
    this.authService.authState$.subscribe(authState => {
      if (authState.user) {
        this.currentUserId = authState.user.uid;
        this.loadCartFromFirestore();
      } else {
        this.currentUserId = null;
        this.clearLocalCart();
      }
    });
  }

  /**
   * Agregar producto al carrito
   */
  addToCart(product: Product, quantity: number = 1): Observable<boolean> {
    if (!this.currentUserId) {
      this.notificationService.showError('Debes iniciar sesión para agregar productos al carrito');
      return of(false);
    }

    const currentCart = this.cartSubject.value;
    const existingItemIndex = currentCart.items.findIndex(item => item.product.id === product.id);

    let updatedItems: CartItem[];
    
    if (existingItemIndex >= 0) {
      // Actualizar cantidad del producto existente
      updatedItems = [...currentCart.items];
      const newQuantity = updatedItems[existingItemIndex].quantity + quantity;
      
      // Verificar stock disponible
      if (newQuantity > product.stock) {
        this.notificationService.showWarn(`Solo hay ${product.stock} unidades disponibles`);
        return of(false);
      }
      
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: newQuantity
      };
    } else {
      // Agregar nuevo producto
      if (quantity > product.stock) {
        this.notificationService.showWarn(`Solo hay ${product.stock} unidades disponibles`);
        return of(false);
      }
      
      const newItem: CartItem = {
        product,
        quantity,
        addedAt: new Date()
      };
      updatedItems = [...currentCart.items, newItem];
    }

    const updatedCart = this.calculateCartTotals(updatedItems);
    
    return this.saveCartToFirestore(updatedCart).pipe(
      map(() => {
        this.cartSubject.next(updatedCart);
        this.notificationService.showSuccess('Producto agregado al carrito');
        return true;
      }),
      catchError(error => {
        console.error('Error al agregar producto al carrito:', error);
        this.notificationService.showError('Error al agregar producto al carrito');
        return of(false);
      })
    );
  }

  /**
   * Actualizar cantidad de un producto en el carrito
   */
  updateQuantity(productId: number, newQuantity: number): Observable<boolean> {
    if (!this.currentUserId) {
      return of(false);
    }

    if (newQuantity <= 0) {
      return this.removeFromCart(productId);
    }

    const currentCart = this.cartSubject.value;
    const itemIndex = currentCart.items.findIndex(item => item.product.id === productId);
    
    if (itemIndex === -1) {
      return of(false);
    }

    const item = currentCart.items[itemIndex];
    
    // Verificar stock disponible
    if (newQuantity > item.product.stock) {
      this.notificationService.showWarn(`Solo hay ${item.product.stock} unidades disponibles`);
      return of(false);
    }

    const updatedItems = [...currentCart.items];
    updatedItems[itemIndex] = {
      ...item,
      quantity: newQuantity
    };

    const updatedCart = this.calculateCartTotals(updatedItems);
    
    return this.saveCartToFirestore(updatedCart).pipe(
      map(() => {
        this.cartSubject.next(updatedCart);
        return true;
      }),
      catchError(error => {
        console.error('Error al actualizar cantidad:', error);
        this.notificationService.showError('Error al actualizar cantidad');
        return of(false);
      })
    );
  }

  /**
   * Remover producto del carrito
   */
  removeFromCart(productId: number): Observable<boolean> {
    if (!this.currentUserId) {
      return of(false);
    }

    const currentCart = this.cartSubject.value;
    const updatedItems = currentCart.items.filter(item => item.product.id !== productId);
    const updatedCart = this.calculateCartTotals(updatedItems);
    
    return this.saveCartToFirestore(updatedCart).pipe(
      map(() => {
        this.cartSubject.next(updatedCart);
        this.notificationService.showSuccess('Producto eliminado del carrito');
        return true;
      }),
      catchError(error => {
        console.error('Error al eliminar producto:', error);
        this.notificationService.showError('Error al eliminar producto');
        return of(false);
      })
    );
  }

  /**
   * Vaciar carrito completamente
   */
  clearCart(): Observable<boolean> {
    if (!this.currentUserId) {
      return of(false);
    }

    const emptyCart: Cart = {
      items: [],
      total: 0,
      itemCount: 0
    };
    
    return this.saveCartToFirestore(emptyCart).pipe(
      map(() => {
        this.cartSubject.next(emptyCart);
        this.notificationService.showSuccess('Carrito vaciado');
        return true;
      }),
      catchError(error => {
        console.error('Error al vaciar carrito:', error);
        this.notificationService.showError('Error al vaciar carrito');
        return of(false);
      })
    );
  }

  /**
   * Obtener cantidad de un producto específico en el carrito
   */
  getProductQuantity(productId: number): number {
    const currentCart = this.cartSubject.value;
    const item = currentCart.items.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  }

  /**
   * Verificar si un producto está en el carrito
   */
  isInCart(productId: number): boolean {
    return this.getProductQuantity(productId) > 0;
  }

  /**
   * Proceder al checkout (simulado)
   */
  proceedToCheckout(): Observable<boolean> {
    if (!this.currentUserId) {
      this.notificationService.showError('Debes iniciar sesión para proceder al pago');
      return of(false);
    }

    const currentCart = this.cartSubject.value;
    
    if (currentCart.items.length === 0) {
      this.notificationService.showWarn('Tu carrito está vacío');
      return of(false);
    }

    // Simular proceso de checkout
    return from(this.createOrder(currentCart)).pipe(
      switchMap(() => this.clearCart()),
      map(() => {
        this.notificationService.showSuccess('¡Pedido realizado con éxito!');
        return true;
      }),
      catchError(error => {
        console.error('Error en checkout:', error);
        this.notificationService.showError('Error al procesar el pedido');
        return of(false);
      })
    );
  }

  /**
   * Cargar carrito desde Firestore
   */
  private loadCartFromFirestore(): void {
    if (!this.currentUserId) return;

    const cartRef = doc(this.firestore, 'carts', this.currentUserId);
    
    from(getDoc(cartRef)).subscribe({
      next: (docSnap) => {
        if (docSnap.exists()) {
          const cartData = docSnap.data() as Cart;
          this.cartSubject.next(cartData);
        } else {
          // Crear carrito vacío si no existe
          const emptyCart: Cart = { items: [], total: 0, itemCount: 0 };
          this.cartSubject.next(emptyCart);
        }
      },
      error: (error) => {
        console.error('Error al cargar carrito:', error);
        // Cargar carrito vacío en caso de error
        const emptyCart: Cart = { items: [], total: 0, itemCount: 0 };
        this.cartSubject.next(emptyCart);
      }
    });
  }

  /**
   * Guardar carrito en Firestore
   */
  private saveCartToFirestore(cart: Cart): Observable<void> {
    if (!this.currentUserId) {
      return of();
    }

    const cartRef = doc(this.firestore, 'carts', this.currentUserId);
    return from(setDoc(cartRef, cart));
  }

  /**
   * Calcular totales del carrito
   */
  private calculateCartTotals(items: CartItem[]): Cart {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    return {
      items,
      total: Math.round(total * 100) / 100, // Redondear a 2 decimales
      itemCount
    };
  }

  /**
   * Limpiar carrito local
   */
  private clearLocalCart(): void {
    const emptyCart: Cart = {
      items: [],
      total: 0,
      itemCount: 0
    };
    this.cartSubject.next(emptyCart);
  }

  /**
   * Crear orden (simulado)
   */
  private async createOrder(cart: Cart): Promise<void> {
    if (!this.currentUserId) return;

    const order = {
      userId: this.currentUserId,
      items: cart.items.map(item => ({
        productId: item.product.id,
        title: item.product.title,
        price: item.product.price,
        quantity: item.quantity,
        total: item.product.price * item.quantity
      })),
      total: cart.total,
      itemCount: cart.itemCount,
      status: 'pending',
      createdAt: new Date(),
      shippingAddress: null, // Se podría agregar en el futuro
      paymentMethod: null    // Se podría agregar en el futuro
    };

    const ordersRef = collection(this.firestore, 'orders');
    await addDoc(ordersRef, order);
  }

  /**
   * Obtener resumen del carrito para mostrar en el header
   */
  getCartSummary(): Observable<{itemCount: number, total: number}> {
    return this.cart$.pipe(
      map(cart => ({
        itemCount: cart.itemCount,
        total: cart.total
      }))
    );
  }
}
