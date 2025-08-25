import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { Product, PagedResult } from '../../models';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  totalCount = 0;
  currentPage = 1;
  pageSize = 12;
  loading = true;
  error: string | null = null;

  // Filters
  searchTerm = '';
  categoryId = '';
  sortBy = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  minPrice = 0;
  maxPrice = 1000;
  
  // Filter options
  sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'price', label: 'Price' },
    { value: 'createdAt', label: 'Newest' }
  ];

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.categoryId = params['id'] || '';
      this.loadFiltersFromQuery();
      this.loadProducts();
    });

    this.route.queryParams.subscribe(queryParams => {
      this.searchTerm = queryParams['search'] || '';
      if (queryParams['search']) {
        this.loadProducts();
      }
    });
  }

  loadFiltersFromQuery(): void {
    const queryParams = this.route.snapshot.queryParams;
    this.currentPage = parseInt(queryParams['page']) || 1;
    this.pageSize = parseInt(queryParams['pageSize']) || 12;
    this.sortBy = queryParams['sortBy'] || 'name';
    this.sortOrder = queryParams['sortOrder'] || 'asc';
    this.minPrice = parseFloat(queryParams['minPrice']) || 0;
    this.maxPrice = parseFloat(queryParams['maxPrice']) || 1000;
  }

  loadProducts(): void {
    this.loading = true;
    this.error = null;

    const params = {
      page: this.currentPage,
      pageSize: this.pageSize,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      ...(this.categoryId && { categoryId: this.categoryId }),
      ...(this.searchTerm && { searchTerm: this.searchTerm }),
      ...(this.minPrice > 0 && { minPrice: this.minPrice }),
      ...(this.maxPrice < 1000 && { maxPrice: this.maxPrice })
    };

    this.productService.getProducts(params).subscribe({
      next: (result: PagedResult<Product>) => {
        this.products = result.data;
        this.totalCount = result.totalCount;
        this.loading = false;
        this.updateUrl();
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.error = 'Failed to load products. Please try again.';
        this.loading = false;
      }
    });
  }

  updateUrl(): void {
    const queryParams: any = {
      page: this.currentPage,
      pageSize: this.pageSize,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };

    if (this.searchTerm) queryParams.search = this.searchTerm;
    if (this.minPrice > 0) queryParams.minPrice = this.minPrice;
    if (this.maxPrice < 1000) queryParams.maxPrice = this.maxPrice;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadProducts();
  }

  onSortChange(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  onPriceFilterChange(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  onProductClick(productId: string): void {
    this.router.navigate(['/product', productId]);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.minPrice = 0;
    this.maxPrice = 1000;
    this.sortBy = 'name';
    this.sortOrder = 'asc';
    this.currentPage = 1;
    this.loadProducts();
  }
}

// product-list.component.html
export const ProductListTemplate = `
<div class="product-list-container">
  <!-- Page Header -->
  <div class="page-header">
    <div class="header-content">
      <h1 class="page-title">
        <span *ngIf="!categoryId && !searchTerm">All Products</span>
        <span *ngIf="categoryId">Category Products</span>
        <span *ngIf="searchTerm">Search Results for "{{ searchTerm }}"</span>
      </h1>
      <p class="results-count" *ngIf="!loading">
        {{ totalCount }} {{ totalCount === 1 ? 'product' : 'products' }} found
      </p>
    </div>
  </div>

  <!-- Filters and Controls -->
  <div class="filters-section">
    <mat-card class="filters-card">
      <div class="filters-content">
        <!-- Sort Controls -->
        <div class="sort-controls">
          <mat-form-field appearance="outline" class="sort-field">
            <mat-label>Sort By</mat-label>
            <mat-select [(value)]="sortBy" (selectionChange)="onSortChange()">
              <mat-option *ngFor="let option of sortOptions" [value]="option.value">
                {{ option.label }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-button-toggle-group [(value)]="sortOrder" 
                                   (change)="onSortChange()"
                                   class="order-toggle">
            <mat-button-toggle value="asc">
              <mat-icon>arrow_upward</mat-icon>
            </mat-button-toggle>
            <mat-button-toggle value="desc">
              <mat-icon>arrow_downward</mat-icon>
            </mat-button-toggle>
          </mat-button-toggle-group>
        </div>

        <!-- Price Range Filter -->
        <div class="price-filter">
          <label class="filter-label">Price Range</label>
          <div class="price-inputs">
            <mat-form-field appearance="outline" class="price-input">
              <mat-label>Min</mat-label>
              <input matInput 
                     type="number" 
                     [(ngModel)]="minPrice"
                     (change)="onPriceFilterChange()"
                     min="0">
              <span matPrefix>$</span>
            </mat-form-field>

            <span class="price-separator">-</span>

            <mat-form-field appearance="outline" class="price-input">
              <mat-label>Max</mat-label>
              <input matInput 
                     type="number" 
                     [(ngModel)]="maxPrice"
                     (change)="onPriceFilterChange()"
                     min="0">
              <span matPrefix>$</span>
            </mat-form-field>
          </div>
        </div>

        <!-- Clear Filters -->
        <button mat-stroked-button 
                color="primary"
                (click)="clearFilters()"
                class="clear-filters-btn">
          <mat-icon>clear</mat-icon>
          Clear Filters
        </button>
      </div>
    </mat-card>
  </div>

  <!-- Loading State -->
  <div class="loading-section" *ngIf="loading">
    <mat-spinner diameter="60"></mat-spinner>
    <p>Loading products...</p>
  </div>

  <!-- Error State -->
  <div class="error-section" *ngIf="error && !loading">
    <mat-icon color="warn">error</mat-icon>
    <p>{{ error }}</p>
    <button mat-button color="primary" (click)="loadProducts()">
      Retry
    </button>
  </div>

  <!-- Products Grid -->
  <div class="products-section" *ngIf="!loading && !error">
    <div class="products-grid" *ngIf="products.length > 0">
      <app-product-card 
        *ngFor="let product of products"
        [product]="product"
        (productClick)="onProductClick($event)">
      </app-product-card>
    </div>

    <!-- Empty State -->
    <div class="empty-state" *ngIf="products.length === 0">
      <mat-icon>search_off</mat-icon>
      <h3>No Products Found</h3>
      <p>Try adjusting your search criteria or filters</p>
      <button mat-raised-button color="primary" (click)="clearFilters()">
        Clear Filters
      </button>
    </div>

    <!-- Pagination -->
    <mat-paginator 
      *ngIf="products.length > 0 && totalCount > pageSize"
      [length]="totalCount"
      [pageSize]="pageSize"
      [pageSizeOptions]="[6, 12, 24, 48]"
      [pageIndex]="currentPage - 1"
      (page)="onPageChange($event)"
      class="pagination">
    </mat-paginator>
  </div>
</div>
`;

// product-list.component.scss  
export const ProductListStyles = `
.product-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-header {
  margin-bottom: 2rem;
  
  .header-content {
    text-align: center;
    
    .page-title {
      font-size: 2.5rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #333;
    }
    
    .results-count {
      font-size: 1.1rem;
      color: #666;
      margin: 0;
    }
  }
}

.filters-section {
  margin-bottom: 2rem;
  
  .filters-card {
    .filters-content {
      display: flex;
      align-items: center;
      gap: 2rem;
      padding: 1rem;
      flex-wrap: wrap;
      
      .sort-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
        
        .sort-field {
          width: 150px;
        }
        
        .order-toggle {
          height: 40px;
        }
      }
      
      .price-filter {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        
        .filter-label {
          font-size: 0.9rem;
          font-weight: 500;
          color: #666;
        }
        
        .price-inputs {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          
          .price-input {
            width: 100px;
          }
          
          .price-separator {
            color: #666;
            font-weight: 500;
          }
        }
      }
      
      .clear-filters-btn {
        margin-left: auto;
      }
    }
  }
}

.loading-section, .error-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  
  mat-icon {
    font-size: 3rem;
    width: 3rem;
    height: 3rem;
    margin-bottom: 1rem;
  }
  
  p {
    font-size: 1.1rem;
    color: #666;
    margin-bottom: 1rem;
  }
}

.products-section {
  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
  }
  
  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    
    mat-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: #ccc;
      margin-bottom: 1rem;
    }
    
    h3 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: #666;
    }
    
    p {
      color: #999;
      margin-bottom: 2rem;
    }
  }
  
  .pagination {
    display: flex;
    justify-content: center;
    margin-top: 2rem;
  }
}

// Mobile Responsive
@media (max-width: 768px) {
  .product-list-container {
    padding: 1rem 0.5rem;
  }
  
  .page-header {
    .header-content {
      .page-title {
        font-size: 2rem;
      }
    }
  }
  
  .filters-section {
    .filters-card {
      .filters-content {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
        
        .sort-controls {
          justify-content: space-between;
          
          .sort-field {
            flex: 1;
            max-width: 200px;
          }
        }
        
        .price-filter {
          .price-inputs {
            justify-content: center;
          }
        }
        
        .clear-filters-btn {
          margin-left: 0;
          align-self: center;
        }
      }
    }
  }
  
  .products-section {
    .products-grid {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
    }
  }
}

@media (max-width: 480px) {
  .products-section {
    .products-grid {
      grid-template-columns: 1fr;
    }
  }
  
  .filters-section {
    .filters-card {
      .filters-content {
        .sort-controls {
          flex-direction: column;
          gap: 0.5rem;
          
          .sort-field {
            width: 100%;
            max-width: none;
          }
        }
      }
    }
  }
}
`;