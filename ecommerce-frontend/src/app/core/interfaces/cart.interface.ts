export interface CartItem {
  id: string;
  productId: number;
  title: string;
  price: number;
  quantity: number;
  thumbnail: string;
  stock: number;
  category: string;
  brand: string;
}

export interface Cart {
  id?: string;
  userId: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CartState {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
}

export interface AddToCartRequest {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  itemId: string;
  quantity: number;
}
