import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  cartItemCount$: Observable<number>;
  categories: Category[] = [];
  searchTerm = '';

  constructor(
    private cartService: CartService,
    private categoryService: CategoryService,
    private router: Router
  ) {
    this.cartItemCount$ = this.cartService.cartItemCount$;
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getMainCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  onSearch(): void {
    if (this.searchTerm.trim()) {
      this.router.navigate(['/products'], {
        queryParams: { search: this.searchTerm.trim() }
      });
    }
  }

  onCategorySelect(categoryId: string): void {
    this.router.navigate(['/products/category', categoryId]);
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  goToOrders(): void {
    this.router.navigate(['/orders']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}

// header.component.html
export const HeaderTemplate = `
<mat-toolbar color="primary" class="header-toolbar">
  <div class="header-container">
    <!-- Logo and Brand -->
    <div class="brand-section" (click)="goHome()">
      <mat-icon class="logo-icon">store</mat-icon>
      <span class="brand-name">EStore</span>
    </div>

    <!-- Navigation Menu -->
    <nav class="nav-section" *ngIf="categories.length > 0">
      <button mat-button 
              *ngFor="let category of categories" 
              (click)="onCategorySelect(category.id)"
              class="nav-button">
        {{ category.name }}
      </button>
    </nav>

    <!-- Search Bar -->
    <div class="search-section">
      <mat-form-field appearance="outline" class="search-field">
        <mat-icon matPrefix>search</mat-icon>
        <input matInput 
               placeholder="Search products..." 
               [(ngModel)]="searchTerm"
               (keyup.enter)="onSearch()">
        <button mat-icon-button 
                matSuffix 
                (click)="onSearch()" 
                *ngIf="searchTerm">
          <mat-icon>send</mat-icon>
        </button>
      </mat-form-field>
    </div>

    <!-- Action Buttons -->
    <div class="actions-section">
      <button mat-icon-button 
              (click)="goToOrders()" 
              matTooltip="Order History">
        <mat-icon>receipt</mat-icon>
      </button>

      <button mat-icon-button 
              (click)="goToCart()" 
              matTooltip="Shopping Cart"
              [matBadge]="cartItemCount$ | async"
              [matBadgeHidden]="(cartItemCount$ | async) === 0"
              matBadgeColor="accent">
        <mat-icon>shopping_cart</mat-icon>
      </button>

      <!-- Mobile Menu Button -->
      <button mat-icon-button 
              class="mobile-menu-button"
              [matMenuTriggerFor]="mobileMenu">
        <mat-icon>menu</mat-icon>
      </button>
    </div>
  </div>
</mat-toolbar>

<!-- Mobile Menu -->
<mat-menu #mobileMenu="matMenu" class="mobile-menu">
  <button mat-menu-item (click)="goHome()">
    <mat-icon>home</mat-icon>
    <span>Home</span>
  </button>
  
  <mat-divider></mat-divider>
  
  <button mat-menu-item 
          *ngFor="let category of categories"
          (click)="onCategorySelect(category.id)">
    <mat-icon>category</mat-icon>
    <span>{{ category.name }}</span>
  </button>
  
  <mat-divider></mat-divider>
  
  <button mat-menu-item (click)="goToCart()">
    <mat-icon [matBadge]="cartItemCount$ | async" 
              [matBadgeHidden]="(cartItemCount$ | async) === 0"
              matBadgeColor="accent">shopping_cart</mat-icon>
    <span>Cart</span>
  </button>
  
  <button mat-menu-item (click)="goToOrders()">
    <mat-icon>receipt</mat-icon>
    <span>Orders</span>
  </button>
</mat-menu>
`;

// header.component.scss
export const HeaderStyles = `
.header-toolbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-container {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  gap: 1rem;
}

.brand-section {
  display: flex;
  align-items: center;
  cursor: pointer;
  min-width: fit-content;
  
  .logo-icon {
    font-size: 28px;
    margin-right: 8px;
  }
  
  .brand-name {
    font-size: 1.5rem;
    font-weight: 500;
  }
}

.nav-section {
  display: flex;
  gap: 0.5rem;
  
  .nav-button {
    color: white;
    font-weight: 400;
  }
}

.search-section {
  flex: 1;
  max-width: 400px;
  
  .search-field {
    width: 100%;
    
    ::ng-deep .mat-form-field-wrapper {
      padding-bottom: 0;
    }
    
    ::ng-deep .mat-form-field-outline {
      color: rgba(255, 255, 255, 0.3);
    }
    
    ::ng-deep .mat-form-field-label {
      color: rgba(255, 255, 255, 0.7);
    }
    
    input {
      color: white;
    }
  }
}

.actions-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: fit-content;
  
  button {
    color: white;
  }
}

.mobile-menu-button {
  display: none;
}

// Mobile Responsive
@media (max-width: 768px) {
  .nav-section {
    display: none;
  }
  
  .mobile-menu-button {
    display: block;
  }
  
  .search-section {
    max-width: 200px;
  }
  
  .brand-name {
    display: none;
  }
}

@media (max-width: 480px) {
  .header-container {
    gap: 0.5rem;
  }
  
  .search-section {
    max-width: 150px;
  }
  
  .search-field {
    ::ng-deep .mat-form-field-outline {
      display: none;
    }
  }
}

::ng-deep .mobile-menu {
  margin-top: 8px;
  
  .mat-menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}
`;