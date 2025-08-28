// product-list.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

// Import your existing services
import { ProductService, Product, ProductFilters } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../core/auth/auth.service';
import { WishlistService } from '../../services/wishlist.service';

interface Category {
  name: string;
  slug: string;
  icon: string;
  count: number;
}

interface PriceRange {
  min: number | null;
  max: number | null;
}

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Component state
  products: Product[] = [];
  categories: Category[] = [];
  loading = true;
  error: string | null = null;
  
  // Pagination
  currentPage = 1;
  pageSize = 12;
  totalProducts = 0;
  totalPages = 0;

  // Filters and search
  searchTerm = '';
  selectedCategory = 'all';
  priceRange: PriceRange = { min: null, max: null };
  sortOption = 'name-asc';
  viewMode: 'grid' | 'list' = 'grid';

  // UI state
  addingToCart: number | null = null;
  wishlistLoading: number | null = null;
  wishlistItems: Set<number> = new Set();

  // Default categories
  defaultCategories: Category[] = [
    { name: 'All Products', slug: 'all', icon: 'inventory', count: 0 },
    { name: 'Fleet Trackers', slug: 'fleet', icon: 'local_shipping', count: 0 },
    { name: 'OBD Trackers', slug: 'obd', icon: 'settings', count: 0 },
    { name: 'Asset Trackers', slug: 'asset', icon: 'security', count: 0 },
    { name: 'Personal Trackers', slug: 'personal', icon: 'person_pin_circle', count: 0 }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private wishlistService: WishlistService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.categories = [...this.defaultCategories];
  }

  ngOnInit(): void {
    this.initializeSearchDebounce();
    this.subscribeToWishlist();
    this.subscribeToQueryParams();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.performSearch();
    });
  }

  private subscribeToWishlist(): void {
    this.wishlistService.wishlistItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.wishlistItems = new Set(items.map(item => item.productId));
      });
  }

  private subscribeToQueryParams(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.searchTerm = params['search'] || '';
        this.selectedCategory = params['category'] || 'all';
        this.currentPage = parseInt(params['page']) || 1;
        this.sortOption = params['sort'] || 'name-asc';
        this.viewMode = params['view'] || 'grid';
        
        if (params['minPrice']) this.priceRange.min = parseFloat(params['minPrice']);
        if (params['maxPrice']) this.priceRange.max = parseFloat(params['maxPrice']);
        
        this.loadProducts();
      });
  }

  private async loadInitialData(): Promise<void> {
    try {
      await Promise.all([
        this.loadCategories(),
        this.loadProducts()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.handleError('Failed to load products');
    }
  }

  private async loadCategories(): Promise<void> {
    try {
      // Simple category counts - you can update this later if you add the API
      const categoryCounts: {[key: string]: number} = {
        fleet: 0,
        obd: 0, 
        asset: 0,
        personal: 0
      };
      
      this.categories = this.defaultCategories.map(cat => ({
        ...cat,
        count: cat.slug === 'all' 
          ? Object.values(categoryCounts).reduce((sum: number, count: number) => sum + count, 0)
          : categoryCounts[cat.slug] || 0
      }));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  private async loadProducts(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      const filters: ProductFilters = {
        page: this.currentPage,
        pageSize: this.pageSize,
        sortBy: this.getSortField() as 'name' | 'price' | 'rating' | 'createdAt',
        sortOrder: this.getSortOrder(),
        searchTerm: this.searchTerm || undefined,
        categoryId: this.selectedCategory !== 'all' ? this.selectedCategory : undefined,
        minPrice: this.priceRange.min || undefined,
        maxPrice: this.priceRange.max || undefined
      };

      const response = await this.productService.getProducts(filters);
      
      this.products = response.products;
      this.totalProducts = response.total;
      this.totalPages = response.totalPages;

    } catch (error: any) {
      console.error('Error loading products:', error);
      this.handleError('Failed to load products. Please try again.');
      this.products = [];
      this.totalProducts = 0;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  // Search functionality
  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  performSearch(): void {
    this.currentPage = 1;
    this.updateURL();
  }

  // Category selection
  selectCategory(categorySlug: string): void {
    if (categorySlug !== this.selectedCategory) {
      this.selectedCategory = categorySlug;
      this.currentPage = 1;
      this.updateURL();
    }
  }

  // Price filtering
  validatePriceRange(): void {
    if (this.priceRange.min && this.priceRange.max) {
      if (this.priceRange.min > this.priceRange.max) {
        const temp = this.priceRange.min;
        this.priceRange.min = this.priceRange.max;
        this.priceRange.max = temp;
        
        this.snackBar.open('Price range adjusted: minimum cannot be greater than maximum', 'Close', {
          duration: 3000
        });
      }
    }

    if (this.priceRange.min !== null && this.priceRange.min < 0) {
      this.priceRange.min = 0;
    }
    if (this.priceRange.max !== null && this.priceRange.max < 0) {
      this.priceRange.max = 0;
    }
  }

  isPriceRangeValid(): boolean {
    return !!(this.priceRange.min || this.priceRange.max);
  }

  applyPriceFilter(): void {
    this.validatePriceRange();
    this.currentPage = 1;
    this.updateURL();
  }

  clearPriceFilter(): void {
    this.priceRange = { min: null, max: null };
    this.currentPage = 1;
    this.updateURL();
  }

  // Filter management
  hasActiveFilters(): boolean {
    return !!(
      this.searchTerm ||
      this.selectedCategory !== 'all' ||
      this.priceRange.min ||
      this.priceRange.max
    );
  }

  clearAllFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = 'all';
    this.priceRange = { min: null, max: null };
    this.currentPage = 1;
    this.updateURL();
    
    this.snackBar.open('All filters cleared', 'Close', {
      duration: 2000
    });
  }

  // Sorting and view mode
  onSortChange(): void {
    this.currentPage = 1;
    this.updateURL();
  }

  setViewMode(mode: 'grid' | 'list'): void {
    if (mode !== this.viewMode) {
      this.viewMode = mode;
      this.updateURL();
    }
  }

  private getSortField(): string {
    return this.sortOption.split('-')[0];
  }

  private getSortOrder(): 'asc' | 'desc' {
    return this.sortOption.split('-')[1] as 'asc' | 'desc';
  }

  // Pagination
  goToPage(page: number | string): void {
    const pageNum = typeof page === 'string' ? parseInt(page) : page;
    
    if (pageNum >= 1 && pageNum <= this.totalPages && pageNum !== this.currentPage) {
      this.currentPage = pageNum;
      this.updateURL();
      
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }

  getVisiblePages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const delta = 2;
    const start = Math.max(1, this.currentPage - delta);
    const end = Math.min(this.totalPages, this.currentPage + delta);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < this.totalPages) {
      if (end < this.totalPages - 1) pages.push('...');
      pages.push(this.totalPages);
    }

    return pages;
  }

  getDisplayStart(): number {
    return Math.min((this.currentPage - 1) * this.pageSize + 1, this.totalProducts);
  }

  getDisplayEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalProducts);
  }

  // Cart functionality
  async addToCart(product: Product, event: Event): Promise<void> {
    event.stopPropagation();
    
    if (product.stock === 0) {
      this.snackBar.open('Product is out of stock', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    if (!this.authService.isLoggedIn$.value) {
      this.snackBar.open('Please sign in to add items to cart', 'Sign In', {
        duration: 5000
      }).onAction().subscribe(() => {
        this.router.navigate(['/sign-in'], { 
          queryParams: { returnUrl: this.router.url } 
        });
      });
      return;
    }

    this.addingToCart = product.id;

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
      this.snackBar.open(
        error.message || 'Failed to add item to cart', 
        'Close', 
        {
          duration: 3000,
          panelClass: ['error-snackbar']
        }
      );
    } finally {
      this.addingToCart = null;
    }
  }

  // Wishlist functionality
  async toggleWishlist(product: Product, event: Event): Promise<void> {
    event.stopPropagation();

    if (!this.authService.isLoggedIn$.value) {
      this.snackBar.open('Please sign in to use wishlist', 'Sign In', {
        duration: 3000
      }).onAction().subscribe(() => {
        this.router.navigate(['/sign-in'], {
          queryParams: { returnUrl: this.router.url }
        });
      });
      return;
    }

    this.wishlistLoading = product.id;

    try {
      if (this.wishlistItems.has(product.id)) {
        await this.wishlistService.removeFromWishlist(product.id);
        this.snackBar.open(`${product.name} removed from wishlist`, 'Close', { 
          duration: 2000,
          panelClass: ['success-snackbar']
        });
      } else {
        await this.wishlistService.addToWishlist(product.id);
        this.snackBar.open(`${product.name} added to wishlist`, 'View Wishlist', {
          duration: 3000,
          panelClass: ['success-snackbar']
        }).onAction().subscribe(() => {
          this.router.navigate(['/wishlist']);
        });
      }
    } catch (error: any) {
      console.error('Error updating wishlist:', error);
      this.snackBar.open(
        error.message || 'Failed to update wishlist', 
        'Close', 
        {
          duration: 3000,
          panelClass: ['error-snackbar']
        }
      );
    } finally {
      this.wishlistLoading = null;
    }
  }

  isInWishlist(productId: number): boolean {
    return this.wishlistItems.has(productId);
  }

  // Navigation
  navigateToProduct(productId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/products', productId]);
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  // URL management
  private updateURL(): void {
    const queryParams: any = {};
    
    if (this.searchTerm) queryParams.search = this.searchTerm;
    if (this.selectedCategory !== 'all') queryParams.category = this.selectedCategory;
    if (this.currentPage > 1) queryParams.page = this.currentPage;
    if (this.sortOption !== 'name-asc') queryParams.sort = this.sortOption;
    if (this.viewMode !== 'grid') queryParams.view = this.viewMode;
    if (this.priceRange.min) queryParams.minPrice = this.priceRange.min;
    if (this.priceRange.max) queryParams.maxPrice = this.priceRange.max;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  // Utility methods
  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  getStarArray(rating: number): number[] {
    const fullStars = Math.floor(rating);
    return Array(fullStars).fill(0);
  }

  getEmptyStarArray(rating: number): number[] {
    const emptyStars = 5 - Math.floor(rating);
    return Array(emptyStars).fill(0);
  }

  getStockIcon(stock: number): string {
    if (stock === 0) return 'error';
    if (stock < 10) return 'warning';
    return 'check_circle';
  }

  getStockText(stock: number): string {
    if (stock === 0) return 'Out of Stock';
    if (stock < 10) return `${stock} Left`;
    return 'In Stock';
  }

  getAddToCartText(product: Product): string {
    if (this.addingToCart === product.id) return 'Adding...';
    if (product.stock === 0) return 'Out of Stock';
    return 'Add to Cart';
  }

  isNewProduct(product: Product): boolean {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return new Date(product.createdAt) > oneMonthAgo;
  }

  getDefaultImage(category: string): string {
    const imageMap: { [key: string]: string } = {
      fleet: '/assets/images/default-fleet-tracker.jpg',
      obd: '/assets/images/default-obd-tracker.jpg',
      asset: '/assets/images/default-asset-tracker.jpg',
      personal: '/assets/images/default-personal-tracker.jpg'
    };
    return imageMap[category] || '/assets/images/default-gps-tracker.jpg';
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/images/default-gps-tracker.jpg';
  }

  private handleError(message: string): void {
    this.error = message;
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}