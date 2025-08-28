import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CartService, Cart, CartItem } from '../../services/cart.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cart: Cart | null = null;
  loading = true;
  updating = false;

  constructor(
    private cartService: CartService,
    private auth: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  private async loadCart(): Promise<void> {
    try {
      this.loading = true;
      this.cart = await this.cartService.loadCart();
    } catch (error: any) {
      console.error('Error loading cart:', error);
      this.snackBar.open('Failed to load cart', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.loading = false;
    }
  }

  async updateQuantity(item: CartItem, quantity: number): Promise<void> {
    if (quantity < 1 || quantity > 10) return;

    try {
      this.updating = true;
      await this.cartService.updateCartItem(item.id, quantity);
      this.snackBar.open('Cart updated', 'Close', {
        duration: 2000,
        panelClass: ['success-snackbar']
      });
    } catch (error: any) {
      console.error('Error updating cart:', error);
      this.snackBar.open('Failed to update cart', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.updating = false;
    }
  }

  async removeItem(item: CartItem): Promise<void> {
    try {
      this.updating = true;
      await this.cartService.removeFromCart(item.id);
      this.snackBar.open(`${item.product.name} removed from cart`, 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    } catch (error: any) {
      console.error('Error removing item:', error);
      this.snackBar.open('Failed to remove item', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.updating = false;
    }
  }

  async clearCart(): Promise<void> {
    try {
      this.updating = true;
      await this.cartService.clearCart();
      this.snackBar.open('Cart cleared', 'Close', {
        duration: 2000,
        panelClass: ['success-snackbar']
      });
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      this.snackBar.open('Failed to clear cart', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.updating = false;
    }
  }

  proceedToCheckout(): void {
    if (!this.cart || this.cart.items.length === 0) {
      this.snackBar.open('Your cart is empty', 'Close', {
        duration: 3000
      });
      return;
    }

    const errors = this.cartService.validateCartForCheckout();
    if (errors.length > 0) {
      this.snackBar.open(errors[0], 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.router.navigate(['/checkout']);
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  // Utility methods
  getSubtotal(): number {
    return this.cartService.calculateSubtotal();
  }

  getTax(): number {
    return this.cartService.calculateTax();
  }

  getShipping(): number {
    return this.cartService.calculateShipping();
  }

  getTotal(): number {
    return this.cartService.calculateTotal();
  }

  formatPrice(price: number): string {
    return this.cartService.formatPrice(price);
  }

  get isEmpty(): boolean {
    return !this.cart || this.cart.items.length === 0;
  }

  get itemCount(): number {
    return this.cart?.totalItems || 0;
  }
}