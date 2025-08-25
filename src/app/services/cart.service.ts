import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from '../services/api.service';
import { Cart, CartItem, CreateCartItemDto, Product } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly endpoint = 'Carts';
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  private cartItemCountSubject = new BehaviorSubject<number>(0);

  public cart$ = this.cartSubject.asObservable();
  public cartItemCount$ = this.cartItemCountSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadCart();
  }

  // Load cart from server or localStorage
  private loadCart(): void {
    const cartId = localStorage.getItem('cartId');
    if (cartId) {
      this.getCart(cartId).subscribe({
        next: (cart) => {
          this.updateCartState(cart);
        },
        error: (error) => {
          console.error('Error loading cart:', error);
          this.createNewCart();
        }
      });
    } else {
      this.createNewCart();
    }
  }

  // Create a new cart
  private createNewCart(): void {
    this.apiService.post<Cart>(this.endpoint, {}).subscribe({
      next: (cart) => {
        localStorage.setItem('cartId', cart.id);
        this.updateCartState(cart);
      },
      error: (error) => {
        console.error('Error creating cart:', error);
        // Fallback to local storage cart
        this.initializeLocalCart();
      }
    });
  }

  // Initialize local cart as fallback
  private initializeLocalCart(): void {
    const localCart: Cart = {
      id: 'local-cart',
      items: [],
      totalAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.updateCartState(localCart);
  }

  // Update cart state
  private updateCartState(cart: Cart): void {
    this.cartSubject.next(cart);
    this.cartItemCountSubject.next(cart.items.reduce((count, item) => count + item.quantity, 0));
  }

  // Get cart by ID
  getCart(id: string): Observable<Cart> {
    return this.apiService.get<Cart>(`${this.endpoint}/${id}`);
  }

  // Add item to cart
  addToCart(productId: string, quantity: number = 1): Observable<Cart> {
    const currentCart = this.cartSubject.value;
    if (!currentCart) {
      throw new Error('Cart not initialized');
    }

    const cartItemDto: CreateCartItemDto = {
      productId,
      quantity
    };

    if (currentCart.id === 'local-cart') {
      return this.addToLocalCart(productId, quantity);
    }

    return this.apiService.post<Cart>(`${this.endpoint}/${currentCart.id}/items`, cartItemDto)
      .pipe(
        tap(cart => this.updateCartState(cart))
      );
  }

  // Add to local cart (fallback)
  private addToLocalCart(productId: string, quantity: number): Observable<Cart> {
    return new Observable(observer => {
      const currentCart = this.cartSubject.value;
      if (!currentCart) {
        observer.error('Cart not initialized');
        return;
      }

      // Check if item already exists
      const existingItem = currentCart.items.find(item => item.productId === productId);
      
      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.totalPrice = existingItem.unitPrice * existingItem.quantity;
      } else {
        // Note: In real implementation, you'd fetch product details
        const newItem: CartItem = {
          id: `item-${Date.now()}`,
          cartId: currentCart.id,
          productId,
          quantity,
          unitPrice: 0, // Would be fetched from product
          totalPrice: 0
        };
        currentCart.items.push(newItem);
      }

      currentCart.totalAmount = currentCart.items.reduce((sum, item) => sum + item.totalPrice, 0);
      currentCart.updatedAt = new Date();

      this.updateCartState(currentCart);
      observer.next(currentCart);
      observer.complete();
    });
  }

  // Update cart item quantity
  updateCartItem(itemId: string, quantity: number): Observable<Cart> {
    const currentCart = this.cartSubject.value;
    if (!currentCart) {
      throw new Error('Cart not initialized');
    }

    if (currentCart.id === 'local-cart') {
      return this.updateLocalCartItem(itemId, quantity);
    }

    return this.apiService.put<Cart>(`${this.endpoint}/${currentCart.id}/items/${itemId}`, { quantity })
      .pipe(
        tap(cart => this.updateCartState(cart))
      );
  }

  // Update local cart item
  private updateLocalCartItem(itemId: string, quantity: number): Observable<Cart> {
    return new Observable(observer => {
      const currentCart = this.cartSubject.value;
      if (!currentCart) {
        observer.error('Cart not initialized');
        return;
      }

      const item = currentCart.items.find(i => i.id === itemId);
      if (item) {
        item.quantity = quantity;
        item.totalPrice = item.unitPrice * quantity;
        currentCart.totalAmount = currentCart.items.reduce((sum, item) => sum + item.totalPrice, 0);
        currentCart.updatedAt = new Date();
        
        this.updateCartState(currentCart);
      }

      observer.next(currentCart);
      observer.complete();
    });
  }

  // Remove item from cart
  removeFromCart(itemId: string): Observable<Cart> {
    const currentCart = this.cartSubject.value;
    if (!currentCart) {
      throw new Error('Cart not initialized');
    }

    if (currentCart.id === 'local-cart') {
      return this.removeFromLocalCart(itemId);
    }

    return this.apiService.delete<Cart>(`${this.endpoint}/${currentCart.id}/items/${itemId}`)
      .pipe(
        tap(cart => this.updateCartState(cart))
      );
  }

  // Remove from local cart
  private removeFromLocalCart(itemId: string): Observable<Cart> {
    return new Observable(observer => {
      const currentCart = this.cartSubject.value;
      if (!currentCart) {
        observer.error('Cart not initialized');
        return;
      }

      currentCart.items = currentCart.items.filter(item => item.id !== itemId);
      currentCart.totalAmount = currentCart.items.reduce((sum, item) => sum + item.totalPrice, 0);
      currentCart.updatedAt = new Date();

      this.updateCartState(currentCart);
      observer.next(currentCart);
      observer.complete();
    });
  }

  // Clear cart
  clearCart(): Observable<Cart> {
    const currentCart = this.cartSubject.value;
    if (!currentCart) {
      throw new Error('Cart not initialized');
    }

    if (currentCart.id === 'local-cart') {
      return this.clearLocalCart();
    }

    return this.apiService.delete<Cart>(`${this.endpoint}/${currentCart.id}`)
      .pipe(
        tap(() => {
          localStorage.removeItem('cartId');
          this.createNewCart();
        })
      );
  }

  // Clear local cart
  private clearLocalCart(): Observable<Cart> {
    return new Observable(observer => {
      const clearedCart: Cart = {
        id: 'local-cart',
        items: [],
        totalAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.updateCartState(clearedCart);
      observer.next(clearedCart);
      observer.complete();
    });
  }

  // Get current cart
  getCurrentCart(): Cart | null {
    return this.cartSubject.value;
  }

  // Get cart item count
  getItemCount(): number {
    const cart = this.cartSubject.value;
    return cart ? cart.items.reduce((count, item) => count + item.quantity, 0) : 0;
  }

  // Get cart total
  getCartTotal(): number {
    const cart = this.cartSubject.value;
    return cart ? cart.totalAmount : 0;
  }
}