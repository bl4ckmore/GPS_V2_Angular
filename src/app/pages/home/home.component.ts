// home.component.ts
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import {
  trigger, style, transition, animate, query, stagger
} from '@angular/animations';

// Import services
import { AuthService } from '../../core/auth/auth.service';
import { ProductService, Product } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';

interface HeroSlide {
  title: string;
  subtitle?: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  buttonIcon?: string;
  secondaryButton?: string;
  secondaryLink?: string;
  secondaryIcon?: string;
  backgroundImage: string;
  badge?: string;
  badgeIcon?: string;
  features?: { icon: string; text: string }[];
  stats?: { number: string; label: string }[];
}

interface NavigationOption {
  name: string;
  link: string;
  icon: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-30px)' }),
        animate('800ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('staggerCards', [
      transition(':enter', [
        query('.product-card', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger('100ms', [
            animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class HomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    public auth: AuthService,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private snackBar: MatSnackBar
  ) {}

  // --- State Management ---
  loading = true;
  currentSlide = 0;
  autoPlay = true;
  slideInterval = 8000;
  isMobile = false;
  cartItemCount = 0;
  wishlistItemCount = 0;
  totalProductCount = 0;
  private slideTimer: any;

  // UI State
  addingToCart: number | null = null;
  wishlistLoading: number | null = null;
  wishlistItems: Set<number> = new Set();

  // --- Data ---
  featuredProducts: Product[] = [];

  // --- Hero slides ---
  heroSlides: HeroSlide[] = [
    {
      title: 'Professional Fleet Management',
      subtitle: 'Enterprise GPS Tracking Solutions',
      description: 'Advanced fleet tracking with real-time monitoring, comprehensive analytics, and 24/7 support. Trusted by thousands of businesses worldwide for mission-critical operations.',
      buttonText: 'Shop Fleet Trackers',
      buttonLink: '/products?category=fleet',
      buttonIcon: 'local_shipping',
      secondaryButton: 'Request Demo',
      secondaryLink: '/demo',
      secondaryIcon: 'play_arrow',
      backgroundImage: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
      badge: 'Enterprise Grade',
      badgeIcon: 'verified',
      stats: [
        { number: '8,500+', label: 'Active Fleets' },
        { number: '99.9%', label: 'Uptime' },
        { number: '24/7', label: 'Support' }
      ]
    },
    {
      title: 'Vehicle Diagnostics & Tracking',
      subtitle: 'OBD-II GPS Solutions',
      description: 'Complete vehicle monitoring with diagnostic capabilities, fuel tracking, and driver behavior analysis. Professional-grade solutions for fleet optimization.',
      buttonText: 'Explore OBD Trackers',
      buttonLink: '/products?category=obd',
      buttonIcon: 'settings',
      backgroundImage: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
      badge: 'Most Popular',
      badgeIcon: 'trending_up',
      stats: [
        { number: '50K+', label: 'Vehicles' },
        { number: '15+', label: 'Data Points' },
        { number: 'Real-time', label: 'Monitoring' }
      ]
    },
    {
      title: 'Asset Security & Tracking',
      subtitle: 'Protect Your Valuable Assets',
      description: 'High-precision GPS tracking for equipment, machinery, and valuable assets. Military-grade security with worldwide coverage and instant alerts.',
      buttonText: 'Shop Asset Trackers',
      buttonLink: '/products?category=asset',
      buttonIcon: 'security',
      backgroundImage: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
      badge: 'High Security',
      badgeIcon: 'security',
      stats: [
        { number: '90-day', label: 'Battery Life' },
        { number: 'Global', label: 'Coverage' },
        { number: 'IP67', label: 'Waterproof' }
      ]
    }
  ];

  // --- Navigation Menus ---
  gpsTrackerOptions: NavigationOption[] = [
    { name: 'Fleet Trackers', link: '/products?category=fleet', icon: 'local_shipping' },
    { name: 'OBD Trackers', link: '/products?category=obd', icon: 'settings' },
    { name: 'Asset Trackers', link: '/products?category=asset', icon: 'security' },
    { name: 'Personal Trackers', link: '/products?category=personal', icon: 'person_pin_circle' },
    { name: 'All Products', link: '/products', icon: 'inventory' }
  ];

  solutionsOptions: NavigationOption[] = [
    { name: 'Fleet Management', link: '/solutions/fleet-management', icon: 'local_shipping' },
    { name: 'Asset Tracking', link: '/solutions/asset-tracking', icon: 'security' },
    { name: 'Logistics Solutions', link: '/solutions/logistics', icon: 'local_shipping' },
    { name: 'Compliance Reporting', link: '/solutions/compliance', icon: 'assessment' }
  ];

  // ===== Lifecycle =====
  ngOnInit(): void {
    this.checkIfMobile();
    this.initializeData();
    this.startAutoSlide();
    this.subscribeToServices();
  }

  ngOnDestroy(): void {
    if (this.slideTimer) clearInterval(this.slideTimer);
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async initializeData(): Promise<void> {
    this.loading = true;
    try {
      await Promise.all([
        this.loadFeaturedProducts(),
        this.loadProductCount()
      ]);
    } catch (error) {
      console.error('Error loading home page data:', error);
      this.snackBar.open('Some content may not be up to date.', 'Close', {
        duration: 3000
      });
    } finally {
      this.loading = false;
    }
  }

  private async loadFeaturedProducts(): Promise<void> {
    try {
      this.featuredProducts = await this.productService.getFeaturedProducts(6);
    } catch (error) {
      console.error('Error loading featured products:', error);
    }
  }

  private async loadProductCount(): Promise<void> {
    try {
      this.totalProductCount = await this.productService.getTotalProductCount();
    } catch (error) {
      console.error('Error loading product count:', error);
      this.totalProductCount = 47; // Fallback
    }
  }

  private subscribeToServices(): void {
    // Subscribe to cart updates
    this.cartService.cartItemCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.cartItemCount = count;
      });

    // Subscribe to wishlist updates
    this.wishlistService.wishlistItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.wishlistItems = new Set(items.map(item => item.productId));
        this.wishlistItemCount = items.length;
      });
  }

  // ===== Responsive =====
  private checkIfMobile(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkIfMobile();
  }

  // ===== Slider controls =====
  startAutoSlide(): void {
    if (this.slideTimer) clearInterval(this.slideTimer);
    if (this.autoPlay && this.heroSlides.length > 1) {
      this.slideTimer = setInterval(() => this.nextSlide(), this.slideInterval);
    }
  }

  nextSlide(): void {
    if (!this.heroSlides.length) return;
    this.currentSlide = (this.currentSlide + 1) % this.heroSlides.length;
  }

  previousSlide(): void {
    if (!this.heroSlides.length) return;
    this.currentSlide = this.currentSlide === 0
      ? this.heroSlides.length - 1
      : this.currentSlide - 1;
  }

  goToSlide(index: number): void {
    if (index >= 0 && index < this.heroSlides.length) {
      this.currentSlide = index;
    }
  }

  // ===== E-commerce Actions =====
  async addToCart(product: Product, event: Event): Promise<void> {
    event.stopPropagation();
    
    if (product.stock === 0) {
      this.snackBar.open('Product is out of stock', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    if (!this.auth.isLoggedIn$.value) {
      this.snackBar.open('Please sign in to add items to cart', 'Sign In', {
        duration: 5000
      }).onAction().subscribe(() => {
        this.router.navigate(['/sign-in']);
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
        this.navigateTo('/cart');
      });
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      this.snackBar.open('Failed to add item to cart', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.addingToCart = null;
    }
  }

  // ===== Wishlist Actions =====
  async toggleWishlist(product: Product, event: Event): Promise<void> {
    event.stopPropagation();

    if (!this.auth.isLoggedIn$.value) {
      this.snackBar.open('Please sign in to use wishlist', 'Sign In', {
        duration: 3000
      }).onAction().subscribe(() => {
        this.router.navigate(['/sign-in']);
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

  // ===== Navigation helpers =====
  navigateTo(route: string): void {
    if (!route) return;
    
    if (/^https?:\/\//i.test(route)) {
      window.location.href = route;
    } else {
      this.router.navigateByUrl(route);
    }
  }

  navigateToProduct(productId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/products', productId]);
  }

  // ===== Utility Methods =====
  getStarArray(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
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
  const imageMap: Record<string, string> = {
    fleet: 'assets/images/default-fleet-tracker.jpg',
    obd: 'assets/images/default-obd-tracker.jpg',
    asset: 'assets/images/default-asset-tracker.jpg',
    // only keep keys for files that actually exist
    personal: 'assets/images/default-asset-tracker.jpg'
  };
  // final fallback MUST exist
  return imageMap[category] || 'assets/images/default-asset-tracker.jpg';
}

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/images/default-gps-tracker.jpg';
  }
}