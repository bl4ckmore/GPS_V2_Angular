import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import {
  trigger, style, transition, animate, query, stagger
} from '@angular/animations';
import { AuthService } from '../../core/auth/auth.service'; // <-- check this path

interface ProductCard {
  title: string;
  description: string;
  image: string;
  link: string;
}

interface HeroSlide {
  title: string;
  subtitle?: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  secondaryButton?: string;
  secondaryLink?: string;
  backgroundImage: string;
  badge?: string;
  badgeIcon?: string;
  features?: { icon: string; text: string }[];
  stats?: { number: string; label: string }[];
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
  /** Expose AuthService to template (used as `auth` in your HTML) */
  constructor(public auth: AuthService, private router: Router) {}

  // --- Slider state ---
  currentSlide = 0;
  autoPlay = true;
  slideInterval = 8000;
  isMobile = false;
  private slideTimer: any;

  // --- Hero slides ---
  heroSlides: HeroSlide[] = [
    {
      title: 'Professional Fleet Management',
      subtitle: 'Enterprise GPS Tracking Solutions',
      description:
        'Advanced fleet tracking with real-time monitoring, comprehensive analytics, and 24/7 support. Trusted by thousands of businesses worldwide for mission-critical operations.',
      buttonText: 'View Solutions',
      buttonLink: '/products/fleet-tracker',
      secondaryButton: 'Request Demo',
      secondaryLink: '/demo',
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
      description:
        'Complete vehicle monitoring with diagnostic capabilities, fuel tracking, and driver behavior analysis. Professional-grade solutions for fleet optimization.',
      buttonText: 'Explore OBD Trackers',
      buttonLink: '/products/obd-tracker',
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
      description:
        'High-precision GPS tracking for equipment, machinery, and valuable assets. Military-grade security with worldwide coverage and instant alerts.',
      buttonText: 'Asset Solutions',
      buttonLink: '/products/asset-tracker',
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

  // --- Top products ---
  topProducts: ProductCard[] = [
    {
      title: 'Enterprise Fleet Management',
      description:
        'Mission-critical fleet tracking with advanced analytics, real-time monitoring, and enterprise-grade security. Trusted by Fortune 500 companies worldwide.',
      image: 'assets/images/fleet-tracker.png',
      link: '/products/fleet-tracker'
    },
    {
      title: 'Professional OBD Tracker',
      description:
        'Military-grade OBD-II tracker with comprehensive vehicle diagnostics, predictive maintenance, and fuel optimization for maximum operational efficiency.',
      image: 'assets/images/obd-tracker.png',
      link: '/products/obd-tracker'
    },
    {
      title: 'High-Security Asset Tracker',
      description:
        'Ultra-secure GPS tracking for critical assets with 90-day battery, global coverage, and military-grade encryption. ISO 27001 certified.',
      image: 'assets/images/asset-tracker.png',
      link: '/products/asset-tracker'
    }
  ];

  // --- Menus (used in navbar dropdowns) ---
  gpsTrackerOptions = [
    { name: 'Fleet Management', link: '/products/fleet-tracker' },
    { name: 'OBD Trackers', link: '/products/obd-tracker' },
    { name: 'Asset Trackers', link: '/products/asset-tracker' },
    { name: 'Personal Trackers', link: '/products/personal-tracker' },
    { name: 'All Products', link: '/products' }
  ];

  solutionsOptions = [
    { name: 'Fleet Management', link: '/solutions/fleet-management' },
    { name: 'Asset Tracking', link: '/solutions/asset-tracking' },
    { name: 'Logistics Solutions', link: '/solutions/logistics' },
    { name: 'Compliance Reporting', link: '/solutions/compliance' }
  ];

  aboutOptions = [
    { name: 'About SEEWORLD', link: '/about' },
    { name: 'Our Technology', link: '/technology' },
    { name: 'Case Studies', link: '/case-studies' },
    { name: 'Contact Us', link: '/contact' }
  ];

  // ===== Lifecycle =====
  ngOnInit(): void {
    this.checkIfMobile();
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    if (this.slideTimer) clearInterval(this.slideTimer);
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

  // ===== Navigation helpers =====
  navigateTo(route: string): void {
    if (!route) return;
    // supports absolute paths and full URLs
    if (/^https?:\/\//i.test(route)) {
      window.location.href = route;
    } else {
      this.router.navigateByUrl(route);
    }
  }

  // ===== Icons for product cards =====
  getProductIcon(productTitle: string): string {
    const t = (productTitle || '').toLowerCase();
    if (t.includes('fleet')) return 'local_shipping';
    if (t.includes('obd')) return 'settings';
    if (t.includes('asset')) return 'security';
    if (t.includes('camera')) return 'videocam';
    return 'gps_fixed';
    }
}
