// services/wishlist.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, firstValueFrom } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/auth/auth.service';

export interface WishlistItem {
  id: number;
  userId: number;
  productId: number;
  createdAt: Date;
  updatedAt: Date;
  product?: {
    id: number;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    category: string;
    stock: number;
    rating?: number;
    reviewCount?: number;
    isActive: boolean;
  };
}

export interface WishlistResponse {
  success: boolean;
  message: string;
  data: WishlistItem[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private readonly API_URL = `${environment.EC_API_BASE}/wishlist`;
  private wishlistItemsSubject = new BehaviorSubject<WishlistItem[]>([]);
  private wishlistCountSubject = new BehaviorSubject<number>(0);

  wishlistItems$ = this.wishlistItemsSubject.asObservable();
  wishlistCount$ = this.wishlistCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.loadWishlist();
      } else {
        this.clearWishlist();
      }
    });
  }

  async getWishlist(): Promise<WishlistItem[]> {
    if (!this.authService.isLoggedIn$.value) {
      throw new Error('User must be logged in to access wishlist');
    }

    try {
      const response = await firstValueFrom(
        this.http.get<WishlistResponse>(this.API_URL, {
          headers: this.getAuthHeaders()
        }).pipe(
          catchError(this.handleError.bind(this))
        )
      );

      if (response.success) {
        this.wishlistItemsSubject.next(response.data);
        this.wishlistCountSubject.next(response.data.length);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to load wishlist');
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
      throw error;
    }
  }

  async addToWishlist(productId: number): Promise<WishlistItem> {
    if (!this.authService.isLoggedIn$.value) {
      throw new Error('User must be logged in to add items to wishlist');
    }

    if (!productId || productId <= 0) {
      throw new Error('Invalid product ID');
    }

    const currentItems = this.wishlistItemsSubject.value;
    const existingItem = currentItems.find(item => item.productId === productId);
    if (existingItem) {
      throw new Error('Product is already in your wishlist');
    }

    try {
      const response = await firstValueFrom(
        this.http.post<{success: boolean, message: string, data: WishlistItem}>(
          this.API_URL, 
          { productId },
          { headers: this.getAuthHeaders() }
        ).pipe(
          catchError(this.handleError.bind(this))
        )
      );

      if (response.success && response.data) {
        const updatedItems = [...currentItems, response.data];
        this.wishlistItemsSubject.next(updatedItems);
        this.wishlistCountSubject.next(updatedItems.length);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to add item to wishlist');
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  }

  async removeFromWishlist(productId: number): Promise<void> {
    if (!this.authService.isLoggedIn$.value) {
      throw new Error('User must be logged in to modify wishlist');
    }

    try {
      const response = await firstValueFrom(
        this.http.delete<{success: boolean, message: string}>(`${this.API_URL}/${productId}`, {
          headers: this.getAuthHeaders()
        }).pipe(
          catchError(this.handleError.bind(this))
        )
      );

      if (response.success) {
        const currentItems = this.wishlistItemsSubject.value;
        const updatedItems = currentItems.filter(item => item.productId !== productId);
        this.wishlistItemsSubject.next(updatedItems);
        this.wishlistCountSubject.next(updatedItems.length);
      } else {
        throw new Error(response.message || 'Failed to remove item from wishlist');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  }

  async clearWishlist(): Promise<void> {
    if (!this.authService.isLoggedIn$.value) {
      this.wishlistItemsSubject.next([]);
      this.wishlistCountSubject.next(0);
      return;
    }

    try {
      const response = await firstValueFrom(
        this.http.delete<{success: boolean, message: string}>(this.API_URL, {
          headers: this.getAuthHeaders()
        }).pipe(
          catchError(this.handleError.bind(this))
        )
      );

      if (response.success) {
        this.wishlistItemsSubject.next([]);
        this.wishlistCountSubject.next(0);
      } else {
        throw new Error(response.message || 'Failed to clear wishlist');
      }
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      throw error;
    }
  }

  isInWishlist(productId: number): boolean {
    const currentItems = this.wishlistItemsSubject.value;
    return currentItems.some(item => item.productId === productId);
  }

  getWishlistCount(): number {
    return this.wishlistCountSubject.value;
  }

  private async loadWishlist(): Promise<void> {
    try {
      await this.getWishlist();
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }
  }

  private getAuthHeaders(): HttpHeaders {
    // Check your AuthService and replace this with the correct method
    // It might be: this.authService.getAccessToken() or this.authService.currentUser.token
    const token = localStorage.getItem('auth_token') || '';
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      switch (error.status) {
        case 0:
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
          break;
        case 401:
          errorMessage = 'You are not authorized. Please sign in again.';
          this.authService.logout();
          break;
        case 403:
          errorMessage = 'Access forbidden.';
          break;
        case 404:
          errorMessage = 'The requested resource was not found.';
          break;
        case 409:
          errorMessage = error.error?.message || 'Item already exists in wishlist.';
          break;
        case 422:
          errorMessage = error.error?.message || 'Invalid data provided.';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          break;
        default:
          errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}