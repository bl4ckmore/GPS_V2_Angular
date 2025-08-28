import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product, ProductService, ProductFilters } from '..//../services/product.service';
import { CartService } from '../..//services/cart.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  loading = true;
  error: string | null = null;
  
  // Pagination
  currentPage = 1;
  pageSize = 12;
  totalProducts = 0;
  totalPages = 0;

  // Filters
  searchTerm = '';
  categoryId = '';
  minPrice?: number;
  maxPrice?: number;
  sortBy: 'name' | 'price' | 'rating' | 'createdAt' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Subscribe to query parameters
    this.route.queryParams.subscribe(params => {
      this.searchTerm = params['search'] || '';
      this.categoryId = params['category'] || '';
      this.currentPage = parseInt(params['page']) || 1;
      this.sortBy = params['sortBy'] || 'name';
      this.sortOrder = params['sortOrder'] || 'asc';
      
      this.loadProducts();
    });
  }

  private async loadProducts(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      const params: ProductFilters = {
        page: this.currentPage,
        pageSize: this.pageSize,
        sortBy: this.sortBy as 'name' | 'price' | 'rating' | 'createdAt',
        sortOrder: this.sortOrder
      };

      if (this.searchTerm) params.searchTerm = this.searchTerm;
      if (this.categoryId) params.categoryId = this.categoryId;
      if (this.minPrice) params.minPrice = this.minPrice;
      if (this.maxPrice) params.maxPrice = this.maxPrice;

      const response = await this.productService.getProducts(params);
      
      this.products = response.products;
      this.totalProducts = response.total;
      this.totalPages = response.totalPages;

    } catch (error: any) {
      console.error('Error loading products:', error);
      this.error = 'Failed to load products';
      this.snackBar.open('Error loading products. Please try again.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.loading = false;
    }
  }

  async addToCart(product: Product, event: Event): Promise<void> {
    event.stopPropagation();
    
    if (product.stock === 0) {
      this.snackBar.open('Product is out of stock', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    try {
      await this.cartService.addToCart(product.id, 1);
      this.snackBar.open(`${product.name} added to cart`, 'View Cart', {
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
    }
  }

  onSearch(): void {
    this.currentPage = 1;
    this.updateQueryParams();
  }

  onSortChange(): void {
    this.currentPage = 1;
    this.updateQueryParams();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updateQueryParams();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.updateQueryParams();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.categoryId = '';
    this.minPrice = undefined;
    this.maxPrice = undefined;
    this.currentPage = 1;
    this.updateQueryParams();
  }

  private updateQueryParams(): void {
    const queryParams: any = {};
    
    if (this.searchTerm) queryParams.search = this.searchTerm;
    if (this.categoryId) queryParams.category = this.categoryId;
    if (this.currentPage > 1) queryParams.page = this.currentPage;
    if (this.sortBy !== 'name') queryParams.sortBy = this.sortBy;
    if (this.sortOrder !== 'asc') queryParams.sortOrder = this.sortOrder;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  navigateToProduct(productId: number): void {
    this.router.navigate(['/products', productId]);
  }

  getStarArray(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  formatPrice(price: number): string {
    return this.productService.formatPrice(price);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}