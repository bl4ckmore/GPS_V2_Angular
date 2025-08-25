import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Cart, CartItem } from '../../models';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cart$: Observable<Cart | null>;
  loading = false;

  constructor(
    private cartService: CartService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.cart$ = this.cartService.cart$;
  }

  ngOnInit(): void {
    // Cart is automatically loaded via the service
  }

  updateQuantity(item: CartItem, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(item);
      return;
    }

    this.loading = true;
    this.cartService.updateCartItem(item.id, quantity).subscribe({
      next: () => {
        this.loading = false;
      },
      error: (error) => {
        console.error('Error updating cart item:', error);
        this.snackBar.open('Failed to update item', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  removeItem(item: CartItem): void {
    this.loading = true;
    this.cartService.removeFromCart(item.id).subscribe({
      next: () => {
        this.snackBar.open('Item removed from cart', 'Undo', {
          duration: 3000
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error removing cart item:', error);
        this.snackBar.open('Failed to remove item', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  clearCart(): void {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.loading = true;
      this.cartService.clearCart().subscribe({
        next: () => {
          this.snackBar.open('Cart cleared', 'Close', { duration: 3000 });
          this.loading = false;
        },
        error: (error) => {
          console.error('Error clearing cart:', error);
          this.snackBar.open('Failed to clear cart', 'Close', { duration: 3000 });
          this.loading = false;
        }
      });
    }
  }

  proceedToCheckout(): void {
    this.router.navigate(['/checkout']);
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  getMainImage(item: CartItem): string {
    if (item.product?.images?.length) {
      const mainImage = item.product.images.find(img => img.isMainImage);
      return mainImage?.imageUrl || item.product.images[0].imageUrl;
    }
    return '/assets/images/product-placeholder.png';
  }
}

// cart.component.html
export const CartTemplate = `
<div class="cart-container">
  <div class="page-header">
    <h1>Shopping Cart</h1>
  </div>

  <div class="cart-content" *ngIf="cart$ | async as cart">
    <!-- Empty Cart -->
    <div class="empty-cart" *ngIf="!cart.items || cart.items.length === 0">
      <div class="empty-cart-content">
        <mat-icon>shopping_cart</mat-icon>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added any items to your cart yet.</p>
        <button mat-raised-button 
                color="primary" 
                (click)="continueShopping()">
          <mat-icon>shopping_bag</mat-icon>
          Continue Shopping
        </button>
      </div>
    </div>

    <!-- Cart Items -->
    <div class="cart-items" *ngIf="cart.items && cart.items.length > 0">
      <div class="cart-header">
        <div class="items-count">
          {{ cart.items.length }} {{ cart.items.length === 1 ? 'item' : 'items' }} in your cart
        </div>
        <button mat-button 
                color="warn" 
                (click)="clearCart()"
                [disabled]="loading">
          <mat-icon>delete_sweep</mat-icon>
          Clear Cart
        </button>
      </div>

      <div class="cart-list">
        <mat-card class="cart-item" *ngFor="let item of cart.items; trackBy: trackByItemId">
          <div class="item-image">
            <img [src]="getMainImage(item)" 
                 [alt]="item.product?.name || 'Product'"
                 onerror="this.src='/assets/images/product-placeholder.png'">
          </div>

          <div class="item-details">
            <h3 class="item-name">{{ item.product?.name || 'Product' }}</h3>
            <p class="item-description">{{ item.product?.description }}</p>
            <div class="item-attributes" *ngIf="item.product?.attributes?.length">
              <mat-chip-listbox>
                <mat-chip *ngFor="let attr of item.product.attributes">
                  {{ attr.name }}: {{ attr.value }}
                </mat-chip>
              </mat-chip-listbox>
            </div>
          </div>

          <div class="item-price">
            <span class="price">{{ formatPrice(item.unitPrice) }}</span>
          </div>

          <div class="item-quantity">
            <div class="quantity-controls">
              <button mat-icon-button 
                      (click)="updateQuantity(item, item.quantity - 1)"
                      [disabled]="loading || item.quantity <= 1">
                <mat-icon>remove</mat-icon>
              </button>
              
              <mat-form-field appearance="outline" class="quantity-input">
                <input matInput 
                       type="number" 
                       [value]="item.quantity"
                       (change)="updateQuantity(item, $event.target.value)"
                       min="1"
                       [disabled]="loading">
              </mat-form-field>
              
              <button mat-icon-button 
                      (click)="updateQuantity(item, item.quantity + 1)"
                      [disabled]="loading">
                <mat-icon>add</mat-icon>
              </button>
            </div>
          </div>

          <div class="item-total">
            <span class="total-price">{{ formatPrice(item.totalPrice) }}</span>
          </div>

          <div class="item-actions">
            <button mat-icon-button 
                    color="warn"
                    (click)="removeItem(item)"
                    [disabled]="loading"
                    matTooltip="Remove item">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </mat-card>
      </div>

      <!-- Cart Summary -->
      <div class="cart-summary">
        <mat-card class="summary-card">
          <mat-card-header>
            <mat-card-title>Order Summary</mat-card-title>
          </mat-card-header>
          
          <mat-card-content>
            <div class="summary-row">
              <span>Subtotal ({{ cart.items.length }} items)</span>
              <span>{{ formatPrice(cart.totalAmount) }}</span>
            </div>
            
            <div class="summary-row">
              <span>Shipping</span>
              <span>{{ cart.totalAmount > 50 ? 'FREE' : formatPrice(9.99) }}</span>
            </div>
            
            <div class="summary-row">
              <span>Tax</span>
              <span>{{ formatPrice(cart.totalAmount * 0.08) }}</span>
            </div>
            
            <mat-divider></mat-divider>
            
            <div class="summary-row total-row">
              <span>Total</span>
              <span>{{ formatPrice(cart.totalAmount + (cart.totalAmount > 50 ? 0 : 9.99) + (cart.totalAmount * 0.08)) }}</span>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button mat-button 
                    color="primary"
                    (click)="continueShopping()">
              Continue Shopping
            </button>
            
            <button mat-raised-button 
                    color="primary"
                    (click)="proceedToCheckout()"
                    [disabled]="loading"
                    class="checkout-btn">
              <mat-icon>payment</mat-icon>
              Proceed to Checkout
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  </div>

  <!-- Loading Overlay -->
  <div class="loading-overlay" *ngIf="loading">
    <mat-spinner diameter="50"></mat-spinner>
  </div>
</div>
`;

// cart.component.scss
export const CartStyles = `
.cart-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  min-height: 60vh;
}

.page-header {
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2.5rem;
    font-weight: 600;
    color: #333;
    text-align: center;
  }
}

.empty-cart {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
  
  .empty-cart-content {
    text-align: center;
    
    mat-icon {
      font-size: 5rem;
      width: 5rem;
      height: 5rem;
      color: #ccc;
      margin-bottom: 1rem;
    }
    
    h2 {
      font-size: 1.5rem;
      color: #666;
      margin-bottom: 1rem;
    }
    
    p {
      color: #999;
      margin-bottom: 2rem;
    }
    
    button {
      mat-icon {
        font-size: 1.2rem;
        width: 1.2rem;
        height: 1.2rem;
        margin-right: 0.5rem;
      }
    }
  }
}

.cart-items {
  .cart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    
    .items-count {
      font-size: 1.2rem;
      font-weight: 500;
      color: #333;
    }
  }
  
  .cart-list {
    margin-bottom: 2rem;
    
    .cart-item {
      display: grid;
      grid-template-columns: 100px 1fr auto auto auto auto;
      gap: 1rem;
      align-items: center;
      margin-bottom: 1rem;
      padding: 1.5rem;
      
      .item-image {
        img {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 8px;
        }
      }
      
      .item-details {
        .item-name {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
          color: #333;
        }
        
        .item-description {
          color: #666;
          font-size: 0.9rem;
          margin: 0 0 0.5rem 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .item-attributes {
          mat-chip {
            font-size: 0.75rem;
            height: 24px;
          }
        }
      }
      
      .item-price {
        .price {
          font-size: 1.1rem;
          font-weight: 600;
          color: #2e7d32;
        }
      }
      
      .item-quantity {
        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          
          .quantity-input {
            width: 80px;
            
            input {
              text-align: center;
            }
          }
        }
      }
      
      .item-total {
        .total-price {
          font-size: 1.2rem;
          font-weight: 700;
          color: #1976d2;
        }
      }
    }
  }
}

.cart-summary {
  display: flex;
  justify-content: flex-end;
  
  .summary-card {
    min-width: 400px;
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1rem;
      
      &.total-row {
        font-size: 1.2rem;
        font-weight: 700;
        color: #1976d2;
        margin-top: 1rem;
      }
    }
    
    mat-card-actions {
      display: flex;
      justify-content: space-between;
      padding-top: 1rem;
      
      .checkout-btn {
        mat-icon {
          margin-right: 0.5rem;
        }
      }
    }
  }
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

// Mobile Responsive
@media (max-width: 768px) {
  .cart-container {
    padding: 1rem 0.5rem;
  }
  
  .cart-items {
    .cart-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }
    
    .cart-list {
      .cart-item {
        grid-template-columns: 1fr;
        gap: 1rem;
        text-align: center;
        
        .item-details {
          order: 1;
        }
        
        .item-image {
          order: 2;
          justify-self: center;
        }
        
        .item-price {
          order: 3;
        }
        
        .item-quantity {
          order: 4;
          justify-self: center;
        }
        
        .item-total {
          order: 5;
        }
        
        .item-actions {
          order: 6;
          justify-self: center;
        }
      }
    }
  }
  
  .cart-summary {
    justify-content: stretch;
    
    .summary-card {
      min-width: auto;
      width: 100%;
      
      mat-card-actions {
        flex-direction: column;
        gap: 1rem;
      }
    }
  }
}
`;

// Add trackBy function for performance
export const trackByItemId = (index: number, item: CartItem): string => {
  return item.id;
};