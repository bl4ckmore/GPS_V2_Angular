import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CartService } from '..//../services/cart.service';
import { AuthService } from '..//..//core/auth/auth.service';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  features?: string[];
  rating?: number;
  reviewCount?: number;
  isActive: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Output() productClick = new EventEmitter<Product>();

  adding = false;

  constructor(
    private cartService: CartService,
    private auth: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  async onAddToCart(event: Event): Promise<void> {
    event.stopPropagation();
    
    if (this.product.stock === 0) {
      this.snackBar.open('Product is out of stock', 'Close', {
        duration: 3000
      });
      return;
    }

    const isLoggedIn = this.auth.isLoggedIn$.value;
    if (!isLoggedIn) {
      this.snackBar.open('Please sign in to add items to cart', 'Sign In', {
        duration: 5000
      }).onAction().subscribe(() => {
        this.router.navigate(['/sign-in']);
      });
      return;
    }

    this.adding = true;
    try {
      await this.cartService.addToCart(this.product.id, 1);
      this.snackBar.open(`${this.product.name} added to cart`, 'View Cart', {
        duration: 3000,
        panelClass: ['success-snackbar']
      }).onAction().subscribe(() => {
        this.router.navigate(['/cart']);
      });
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      this.snackBar.open('Failed to add item to cart', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.adding = false;
    }
  }

  onProductClick(): void {
    this.productClick.emit(this.product);
  }

  getStarArray(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }
}