import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { AuthService } from '..//core/auth/auth.service';
import { ProductService, Product } from './product.service';
import { environment } from '../../..//.//src/environments/environment';

export interface CartItem {
  id: number;
  userId: number;
  productId: number;
  product: Product;
  quantity: number;
  price: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CheckoutRequest {
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: {
    type: 'card' | 'paypal';
    cardToken?: string;
    paypalToken?: string;
  };
}

export interface Order {
  id: number;
  userId: number;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: any;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private baseUrl: string;
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  private cartItemCountSubject = new BehaviorSubject<number>(0);

  public cart$ = this.cartSubject.asObservable();
  public cartItemCount$ = this.cartItemCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private productService: ProductService
  ) {
    const api = (environment.EC_API_BASE || '').replace(/\/+$/, '');
    this.baseUrl = `${api}/api/cart`;

    // Initialize cart when user logs in
    this.auth.isLoggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.loadCart();
      } else {
        this.clearCartState();
      }
    });
  }

  // ===== CART MANAGEMENT =====

  async loadCart(): Promise<Cart | null> {
    const isLoggedIn = this.auth.isLoggedIn$.value;
    if (!isLoggedIn) {
      return null;
    }

    try {
      const cart = await firstValueFrom(
        this.http.get<Cart>(this.baseUrl)
      );
      
      this.cartSubject.next(cart);
      this.cartItemCountSubject.next(cart.totalItems);
      return cart;
    } catch (error: any) {
      console.error('Error loading cart:', error);
      
      // If cart doesn't exist (404), create one
      if (error?.status === 404) {
        return await this.createCart();
      }
      
      throw error;
    }
  }

  private async createCart(): Promise<Cart> {
    try {
      const cart = await firstValueFrom(
        this.http.post<Cart>(this.baseUrl, {})
      );
      
      this.cartSubject.next(cart);
      this.cartItemCountSubject.next(0);
      return cart;
    } catch (error) {
      console.error('Error creating cart:', error);
      throw error;
    }
  }

  async addToCart(productId: number, quantity: number = 1): Promise<CartItem> {
    const isLoggedIn = this.auth.isLoggedIn$.value;
    if (!isLoggedIn) {
      throw new Error('Please sign in to add items to cart');
    }

    try {
      const cartItem = await firstValueFrom(
        this.http.post<CartItem>(`${this.baseUrl}/items`, {
          productId,
          quantity
        })
      );

      // Reload cart to get updated totals
      await this.loadCart();
      
      return cartItem;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  async updateCartItem(itemId: number, quantity: number): Promise<CartItem> {
    const isLoggedIn = this.auth.isLoggedIn$.value;
    if (!isLoggedIn) {
      throw new Error('Please sign in to update cart');
    }

    try {
      const cartItem = await firstValueFrom(
        this.http.put<CartItem>(`${this.baseUrl}/items/${itemId}`, {
          quantity
        })
      );

      // Reload cart to get updated totals
      await this.loadCart();
      
      return cartItem;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  }

  async removeFromCart(itemId: number): Promise<void> {
    const isLoggedIn = this.auth.isLoggedIn$.value;
    if (!isLoggedIn) {
      throw new Error('Please sign in to remove items from cart');
    }

    try {
      await firstValueFrom(
        this.http.delete(`${this.baseUrl}/items/${itemId}`)
      );

      // Reload cart to get updated totals
      await this.loadCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  }

  async clearCart(): Promise<void> {
    const isLoggedIn = this.auth.isLoggedIn$.value;
    if (!isLoggedIn) {
      throw new Error('Please sign in to clear cart');
    }

    try {
      await firstValueFrom(
        this.http.delete(`${this.baseUrl}/clear`)
      );
      
      this.clearCartState();
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }

  private clearCartState(): void {
    this.cartSubject.next(null);
    this.cartItemCountSubject.next(0);
  }

  // ===== CHECKOUT =====

  async checkout(checkoutData: CheckoutRequest): Promise<Order> {
    const isLoggedIn = this.auth.isLoggedIn$.value;
    if (!isLoggedIn) {
      throw new Error('Please sign in to checkout');
    }

    try {
      const order = await firstValueFrom(
        this.http.post<Order>(`${this.baseUrl}/checkout`, checkoutData)
      );

      // Clear cart after successful checkout
      this.clearCartState();

      return order;
    } catch (error) {
      console.error('Error during checkout:', error);
      throw error;
    }
  }

  async validateCheckout(): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const result = await firstValueFrom(
        this.http.post<{ valid: boolean; errors: string[] }>(`${this.baseUrl}/validate`, {})
      );
      return result;
    } catch (error) {
      console.error('Error validating checkout:', error);
      return { valid: false, errors: ['Validation failed'] };
    }
  }

  // ===== UTILITY METHODS =====

  get currentCart(): Cart | null {
    return this.cartSubject.value;
  }

  get cartItemCount(): number {
    return this.cartItemCountSubject.value;
  }

  isItemInCart(productId: number): boolean {
    const cart = this.currentCart;
    if (!cart) return false;
    
    return cart.items.some(item => item.productId === productId);
  }

  getCartItemByProductId(productId: number): CartItem | null {
    const cart = this.currentCart;
    if (!cart) return null;
    
    return cart.items.find(item => item.productId === productId) || null;
  }

  calculateSubtotal(): number {
    const cart = this.currentCart;
    if (!cart) return 0;
    
    return cart.items.reduce((total, item) => total + item.totalPrice, 0);
  }

  calculateTax(taxRate: number = 0.08): number {
    return this.calculateSubtotal() * taxRate;
  }

  calculateShipping(freeShippingThreshold: number = 100): number {
    const subtotal = this.calculateSubtotal();
    return subtotal >= freeShippingThreshold ? 0 : 15.99;
  }

  calculateTotal(taxRate: number = 0.08, freeShippingThreshold: number = 100): number {
    const subtotal = this.calculateSubtotal();
    const tax = this.calculateTax(taxRate);
    const shipping = this.calculateShipping(freeShippingThreshold);
    
    return subtotal + tax + shipping;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  // ===== VALIDATION =====

  validateCartForCheckout(): string[] {
    const errors: string[] = [];
    const cart = this.currentCart;

    if (!cart || cart.items.length === 0) {
      errors.push('Cart is empty');
      return errors;
    }

    // Check if all items are still in stock
    for (const item of cart.items) {
      if (!item.product.isActive) {
        errors.push(`${item.product.name} is no longer available`);
      }
      
      if (item.product.stock < item.quantity) {
        errors.push(`Only ${item.product.stock} units of ${item.product.name} are available`);
      }
    }

    return errors;
  }

  // ===== GUEST CART FALLBACK =====

  private getGuestCartKey(): string {
    return 'guestCart';
  }

  saveGuestCart(items: Partial<CartItem>[]): void {
    if (typeof Storage !== 'undefined') {
      localStorage.setItem(this.getGuestCartKey(), JSON.stringify(items));
    }
  }

  loadGuestCart(): Partial<CartItem>[] {
    if (typeof Storage !== 'undefined') {
      const cartData = localStorage.getItem(this.getGuestCartKey());
      return cartData ? JSON.parse(cartData) : [];
    }
    return [];
  }

  clearGuestCart(): void {
    if (typeof Storage !== 'undefined') {
      localStorage.removeItem(this.getGuestCartKey());
    }
  }

  async migrateGuestCartToUser(): Promise<void> {
    const guestItems = this.loadGuestCart();
    if (guestItems.length === 0) return;

    try {
      for (const item of guestItems) {
        if (item.productId && item.quantity) {
          await this.addToCart(item.productId, item.quantity);
        }
      }
      this.clearGuestCart();
    } catch (error) {
      console.error('Error migrating guest cart:', error);
    }
  }
}