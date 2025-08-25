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

// product-card.component.html
export const ProductCardTemplate = `
<mat-card class="product-card" 
          [class.out-of-stock]="isOutOfStock()"
          (click)="onProductClick()">
  
  <div class="product-image-container">
    <img [src]="getMainImage()" 
         [alt]="product.name"
         class="product-image"
         onerror="this.src='/assets/images/product-placeholder.png'">
    
    <div class="stock-overlay" *ngIf="isOutOfStock()">
      <span class="out-of-stock-text">Out of Stock</span>
    </div>
    
    <div class="product-actions">
      <button mat-fab 
              color="primary"
              class="add-to-cart-btn"
              (click)="onAddToCart($event)"
              [disabled]="isOutOfStock()"
              matTooltip="Add to Cart">
        <mat-icon>add_shopping_cart</mat-icon>
      </button>
    </div>
  </div>
  
  <mat-card-content class="product-content">
    <div class="product-header">
      <h3 class="product-name" [title]="product.name">
        {{ product.name }}
      </h3>
      <p class="product-price">
        {{ formatPrice(product.price) }}
      </p>
    </div>
    
    <p class="product-description" [title]="product.description">
      {{ product.description }}
    </p>
    
    <div class="product-footer">
      <div class="stock-info" *ngIf="!isOutOfStock()">
        <mat-icon class="stock-icon" 
                  [color]="product.stockQuantity > 10 ? 'primary' : 'warn'">
          inventory
        </mat-icon>
        <span class="stock-text"
              [class.low-stock]="product.stockQuantity <= 10">
          {{ product.stockQuantity }} in stock
        </span>
      </div>
      
      <div class="product-attributes" *ngIf="product.attributes?.length">
        <mat-chip-listbox class="attributes-list">
          <mat-chip *ngFor="let attr of product.attributes.slice(0, 2)"
                    class="attribute-chip">
            {{ attr.value }}
          </mat-chip>
        </mat-chip-listbox>
      </div>
    </div>
  </mat-card-content>
</mat-card>
`;

// product-card.component.scss
export const ProductCardStyles = `
.product-card {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    
    .product-actions {
      opacity: 1;
      visibility: visible;
    }
    
    .product-image {
      transform: scale(1.05);
    }
  }
  
  &.out-of-stock {
    opacity: 0.7;
    
    .product-image {
      filter: grayscale(50%);
    }
  }
}

.product-image-container {
  position: relative;
  height: 250px;
  overflow: hidden;
  background-color: #f5f5f5;
  
  .product-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  
  .stock-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    
    .out-of-stock-text {
      color: white;
      font-size: 1.1rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  }
  
  .product-actions {
    position: absolute;
    top: 1rem;
    right: 1rem;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    
    .add-to-cart-btn {
      width: 48px;
      height: 48px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      
      &:hover {
        transform: scale(1.1);
      }
    }
  }
}

.product-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  
  .product-header {
    margin-bottom: 0.75rem;
    
    .product-name {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
      line-height: 1.3;
      color: #333;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      min-height: 2.6rem;
    }
    
    .product-price {
      font-size: 1.25rem;
      font-weight: 700;
      color: #2e7d32;
      margin: 0;
    }
  }
  
  .product-description {
    color: #666;
    font-size: 0.9rem;
    line-height: 1.4;
    margin: 0 0 1rem 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }
  
  .product-footer {
    margin-top: auto;
    
    .stock-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      
      .stock-icon {
        font-size: 1rem;
        width: 1rem;
        height: 1rem;
      }
      
      .stock-text {
        font-size: 0.85rem;
        color: #666;
        
        &.low-stock {
          color: #f57c00;
          font-weight: 500;
        }
      }
    }
    
    .product-attributes {
      .attributes-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        
        .attribute-chip {
          font-size: 0.75rem;
          height: 24px;
          background-color: #e3f2fd;
          color: #1976d2;
        }
      }
    }
  }
}

// Mobile Responsive
@media (max-width: 768px) {
  .product-card {
    &:hover {
      transform: none;
      
      .product-actions {
        opacity: 1;
        visibility: visible;
      }
    }
  }
  
  .product-image-container {
    height: 200px;
    
    .product-actions {
      opacity: 1;
      visibility: visible;
      
      .add-to-cart-btn {
        width: 40px;
        height: 40px;
      }
    }
  }
  
  .product-content {
    padding: 1rem;
    
    .product-header {
      .product-name {
        font-size: 1rem;
      }
      
      .product-price {
        font-size: 1.1rem;
      }
    }
  }
}

@media (max-width: 480px) {
  .product-image-container {
    height: 180px;
  }
  
  .product-content {
    padding: 0.75rem;
  }
}
`;