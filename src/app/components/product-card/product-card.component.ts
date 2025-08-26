import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product } from '../../models';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Output() productClick = new EventEmitter<string>();

  constructor(
    private cartService: CartService,
    private snackBar: MatSnackBar
  ) { }

  onProductClick(): void {
    this.productClick.emit(this.product.id);
  }

  onAddToCart(event: Event): void {
    event.stopPropagation();
    
    this.cartService.addToCart(this.product.id, 1).subscribe({
      next: () => {
        this.snackBar.open('Product added to cart', 'View Cart', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        this.snackBar.open('Failed to add product to cart', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      }
    });
  }

  getMainImage(): string {
    const mainImage = this.product.images?.find(img => img.isMainImage);
    return mainImage?.imageUrl || this.product.images?.[0]?.imageUrl || '/assets/images/product-placeholder.png';
  }

  isOutOfStock(): boolean {
    return this.product.stockQuantity <= 0;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }
}

