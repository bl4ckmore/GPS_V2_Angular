import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  trigger, style, transition, animate, query, stagger
} from '@angular/animations';
import { AuthService } from '../../core/auth/auth.service';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';

interface Product {
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

interface ProductCategory {
  id: number;
  name: string;
  description: string;
  slug: string;
  icon: string;
  productCount: number;
  priceFrom: number;
}

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
  constructor(
    public auth: AuthService,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private snackBar: MatSnackBar
  ) {}

  // --- State Management ---
  loading = true;
  currentSlide = 0;
  autoPlay = true;
  slideInterval = 8000;
  isMobile = false;
  cartItemCount = 0;
  totalProductCount = 0;
  private slideTimer: any;

  // --- Data ---
  featuredProducts: Product[] = [];
  productCategories: ProductCategory[] = [];

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
    this.subscribeToCartUpdates();
  }

  ngOnDestroy(): void {
    if (this.slideTimer) clearInterval(this.slideTimer);
  }

  private async initializeData(): Promise<void> {
    this.loading = true;
    try {
      // Load featured products
      await this.loadFeaturedProducts();
      
      // Load product categories
      await this.loadProductCategories();
      
      // Get total product count
      this.totalProductCount = await this.productService.getTotalProductCount();
      
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

  private async loadProductCategories(): Promise<void> {
    try {
      this.productCategories = await this.productService.getProductCategories();
    } catch (error) {
      console.error('Error loading product categories:', error);
    }
  }

  private subscribeToCartUpdates(): void {
    this.cartService.cartItemCount$.subscribe(count => {
      this.cartItemCount = count;
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

    const isLoggedIn = this.auth.isLoggedIn$.value;
    if (!isLoggedIn) {
      this.snackBar.open('Please sign in to add items to cart', 'Sign In', {
        duration: 5000
      }).onAction().subscribe(() => {
        this.router.navigate(['/sign-in']);
      });
      return;
    }

    try {
      await this.cartService.addToCart(product.id, 1);
      this.snackBar.open(`${product.name} added to cart`, 'View Cart', {
        duration: 3000,
        panelClass: ['success-snackbar']
      }).onAction().subscribe(() => {
        this.navigateTo('/cart');
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      this.snackBar.open('Failed to add item to cart', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  performSearch(query: string): void {
    if (!query.trim()) return;
    this.navigateTo(`/products?search=${encodeURIComponent(query)}`);
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

  // ===== Utility Methods =====
  getStarArray(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  getProductIcon(productTitle: string): string {
    const t = (productTitle || '').toLowerCase();
    if (t.includes('fleet')) return 'local_shipping';
    if (t.includes('obd')) return 'settings';
    if (t.includes('asset')) return 'security';
    if (t.includes('personal')) return 'person_pin_circle';
    return 'gps_fixed';
  }
}