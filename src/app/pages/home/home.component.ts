import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, state, style, transition, animate, query, stagger, keyframes } from '@angular/animations';

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
  features?: {icon: string; text: string}[];
  stats?: {number: string; label: string}[];
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [
    // Hero content animation
    trigger('heroContentAnimation', [
      state('active', style({ opacity: 1, transform: 'translateY(0)' })),
      state('inactive', style({ opacity: 0, transform: 'translateY(30px)' })),
      transition('inactive => active', [
        animate('0.8s ease-out')
      ]),
      transition('active => inactive', [
        animate('0.3s ease-in')
      ])
    ]),

    // Slide animations
    trigger('slideInLeft', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-100px)' }),
        animate('1s cubic-bezier(0.4, 0, 0.2, 1)', 
                style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),

    trigger('visualAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100px) scale(0.8)' }),
        animate('1s cubic-bezier(0.4, 0, 0.2, 1)', 
                style({ opacity: 1, transform: 'translateX(0) scale(1)' }))
      ])
    ]),

    // Text animations
    trigger('badgeAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px) scale(0.8)' }),
        animate('0.6s 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
                style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ])
    ]),

    trigger('titleAnimation', [
      transition(':enter', [
        query('.title-word', [
          style({ opacity: 0, transform: 'translateY(50px)' }),
          stagger('0.1s', [
            animate('0.8s cubic-bezier(0.4, 0, 0.2, 1)', 
                    style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ])
      ])
    ]),

    trigger('descriptionAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('0.8s 0.6s cubic-bezier(0.4, 0, 0.2, 1)', 
                style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),

    trigger('statsAnimation', [
      transition(':enter', [
        query('.stat-item', [
          style({ opacity: 0, transform: 'translateY(30px) scale(0.8)' }),
          stagger('0.2s', [
            animate('0.8s cubic-bezier(0.4, 0, 0.2, 1)', 
                    style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
          ])
        ])
      ])
    ]),

    trigger('actionsAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(40px)' }),
        animate('0.8s 0.8s cubic-bezier(0.4, 0, 0.2, 1)', 
                style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),

    // Section animations
    trigger('sectionBadgeAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-30px)' }),
        animate('0.8s cubic-bezier(0.4, 0, 0.2, 1)', 
                style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),

    trigger('sectionTitleAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(50px)' }),
        animate('0.8s 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
                style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),

    trigger('sectionDescriptionAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('0.8s 0.4s cubic-bezier(0.4, 0, 0.2, 1)', 
                style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),

    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(50px) scale(0.9)' }),
        animate('0.8s cubic-bezier(0.4, 0, 0.2, 1)', 
                style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ])
    ])
  ]
})
export class HomeComponent implements OnInit, OnDestroy {
  currentSlide = 0;
  autoPlay = true;
  slideInterval = 10000; // 10 seconds for better UX
  showNavigationControls = false;
  showScrollHint = false;
  showSwipeHint = false;
  showKeyboardHint = false;
  isMobile = false;
  isTransitioning = false;
  
  // Touch/Mouse interaction properties
  private slideTimer: any;
  private hintTimer: any;
  private touchStartX = 0;
  private touchStartY = 0;
  private isScrollingVertically = false;
  private wheelTimeout: any;
  private lastWheelTime = 0;
  
  // Particles for background animation
  particles = Array.from({length: 15}, () => ({
    style: {
      left: Math.random() * 100 + '%',
      top: Math.random() * 100 + '%',
      'animation-delay': Math.random() * 20 + 's',
      'animation-duration': (Math.random() * 10 + 15) + 's'
    }
  }));

  heroSlides: HeroSlide[] = [
    {
      title: 'V7 Pro 4G Dual Dash Cam',
      description: 'Dual 1080P cameras, real-time tracking, and AI-powered driver monitoring — built for fleet safety and efficiency.',
      buttonText: 'Discover V7 Pro',
      buttonLink: '/products/dash-cam',
      backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      badge: 'Fleet Management Solutions',
      badgeIcon: 'local_shipping',
      stats: [
        { number: '1080P', label: 'Dual Cameras' },
        { number: '24/7', label: 'Monitoring' },
        { number: 'AI', label: 'Powered' }
      ]
    },
    {
      title: 'Smarter Tracking Starts Here',
      description: 'Get instant alerts, 2-second location updates, and long battery life — trusted by 5,400+ fleet businesses worldwide.',
      buttonText: 'Get Started',
      buttonLink: '/products/fleet-tracker',
      secondaryButton: 'Learn More',
      secondaryLink: '/solutions/fleet-management',
      backgroundImage: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
      badge: 'Industry Leading',
      badgeIcon: 'trending_up',
      features: [
        {icon: 'speed', text: '2-second updates'},
        {icon: 'battery_full', text: 'Long battery life'},
        {icon: 'notifications_active', text: 'Instant alerts'}
      ],
      stats: [
        { number: '5,400+', label: 'Businesses' },
        { number: '2-sec', label: 'Updates' },
        { number: '99.9%', label: 'Uptime' }
      ]
    },
    {
      title: 'Fleet Management Solutions',
      description: 'Real-time GPS tracking for efficient fleet operations and safety with comprehensive monitoring tools.',
      buttonText: 'View Fleet Solutions',
      buttonLink: '/solutions/fleet-management',
      backgroundImage: 'linear-gradient(135deg, #8e44ad 0%, #3498db 100%)',
      badge: 'Enterprise Ready',
      badgeIcon: 'business',
      features: [
        {icon: 'track_changes', text: 'Real-time tracking'},
        {icon: 'security', text: 'Advanced security'},
        {icon: 'analytics', text: 'Fleet analytics'}
      ],
      stats: [
        { number: '500+', label: 'Fleet Clients' },
        { number: '24/7', label: 'Support' },
        { number: '100%', label: 'Secure' }
      ]
    },
    {
      title: 'Pet Safety Tracking',
      description: 'Keep your pets safe and never lose track of them again with our advanced GPS tracking technology.',
      buttonText: 'Discover Pet Tracker',
      buttonLink: '/products/pet-tracker',
      backgroundImage: 'linear-gradient(135deg, #27ae60 0%, #e67e22 100%)',
      badge: 'Family Protection',
      badgeIcon: 'pets',
      features: [
        {icon: 'pets', text: 'Pet-friendly design'},
        {icon: 'location_on', text: 'Precise location'},
        {icon: 'health_and_safety', text: 'Safety zones'}
      ],
      stats: [
        { number: '50K+', label: 'Happy Pets' },
        { number: '30-day', label: 'Battery' },
        { number: 'IP67', label: 'Waterproof' }
      ]
    }
  ];

  productCards: ProductCard[] = [
    {
      title: 'OBD Tracker',
      description: 'Optimize your vehicles with smart diagnostics and real-time GPS tracking.',
      image: 'assets/images/obd-tracker.png',
      link: '/products/obd-tracker'
    },
    {
      title: 'Fleet Tracker',
      description: 'Real-time GPS tracking for efficient fleet operations and safety.',
      image: 'assets/images/fleet-tracker.png',
      link: '/products/fleet-tracker'
    },
    {
      title: 'Pet Tracker',
      description: 'Keep your pets safe and never lose track of them again.',
      image: 'assets/images/pet-tracker.png',
      link: '/products/pet-tracker'
    },
    {
      title: 'Dash Cam',
      description: 'Capture and record every moment on the road with HD clarity.',
      image: 'assets/images/dash-cam.png',
      link: '/products/dash-cam'
    }
  ];

  gpsTrackerOptions = [
    { name: 'OBD Tracker', link: '/products/obd-tracker' },
    { name: 'Fleet Tracker', link: '/products/fleet-tracker' },
    { name: 'Pet Tracker', link: '/products/pet-tracker' },
    { name: 'Personal Tracker', link: '/products/personal-tracker' },
    { name: 'Asset Tracker', link: '/products/asset-tracker' }
  ];

  solutionsOptions = [
    { name: 'Fleet Management', link: '/solutions/fleet-management' },
    { name: 'Asset Tracking', link: '/solutions/asset-tracking' },
    { name: 'Personal Safety', link: '/solutions/personal-safety' },
    { name: 'Pet Safety', link: '/solutions/pet-safety' }
  ];

  aboutOptions = [
    { name: 'Our Company', link: '/about/company' },
    { name: 'Our Team', link: '/about/team' },
    { name: 'Careers', link: '/about/careers' },
    { name: 'News & Press', link: '/about/news' }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.checkIfMobile();
    this.startAutoSlide();
    this.showInteractionHints();
    
    // Focus the hero section for keyboard navigation
    setTimeout(() => {
      const heroSection = document.querySelector('.hero-section') as HTMLElement;
      if (heroSection) {
        heroSection.focus();
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    this.clearAllTimers();
  }

  private clearAllTimers(): void {
    if (this.slideTimer) clearInterval(this.slideTimer);
    if (this.wheelTimeout) clearTimeout(this.wheelTimeout);
    if (this.hintTimer) clearTimeout(this.hintTimer);
  }

  private checkIfMobile(): void {
    this.isMobile = window.innerWidth <= 768 || 
                   /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private showInteractionHints(): void {
    // Show hints after user has seen the first slide
    this.hintTimer = setTimeout(() => {
      if (!this.isMobile) {
        this.showScrollHint = true;
        setTimeout(() => {
          this.showScrollHint = false;
          this.showKeyboardHint = true;
          setTimeout(() => {
            this.showKeyboardHint = false;
          }, 3000);
        }, 3000);
      } else {
        this.showSwipeHint = true;
        setTimeout(() => {
          this.showSwipeHint = false;
        }, 4000);
      }
    }, 3000);
  }

  // Enhanced mouse/touch interactions
  onMouseEnterHero(): void {
    if (!this.isMobile) {
      this.showNavigationControls = true;
    }
  }

  onMouseLeaveHero(): void {
    if (!this.isMobile) {
      this.showNavigationControls = false;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.checkIfMobile();
  }

  // Fixed mouse wheel handler
  onMouseWheel(event: WheelEvent): void {
    if (this.isMobile || this.isTransitioning) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const now = Date.now();
    if (now - this.lastWheelTime < 300) return; // Debounce
    
    this.lastWheelTime = now;
    
    if (event.deltaY > 0) {
      this.manualSlideChange('next');
    } else {
      this.manualSlideChange('prev');
    }
  }

  // Enhanced touch handlers
  onTouchStart(event: TouchEvent): void {
    if (!this.isMobile || this.isTransitioning) return;
    
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.isScrollingVertically = false;
    
    // Prevent default to improve swipe responsiveness
    if (event.touches.length === 1) {
      event.preventDefault();
    }
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isMobile || this.isTransitioning) return;
    
    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - this.touchStartX);
    const deltaY = Math.abs(touch.clientY - this.touchStartY);
    
    // Determine scroll direction
    if (deltaY > deltaX && deltaY > 15) {
      this.isScrollingVertically = true;
    } else if (deltaX > 15) {
      event.preventDefault(); // Prevent scrolling during horizontal swipe
    }
  }

  onTouchEnd(event: TouchEvent): void {
    if (!this.isMobile || this.isScrollingVertically || this.isTransitioning) return;
    
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const minSwipeDistance = 80; // Increased for better UX
    
    if (Math.abs(deltaX) > minSwipeDistance) {
      event.preventDefault();
      
      if (deltaX > 0) {
        this.manualSlideChange('prev'); // Swipe right = previous
      } else {
        this.manualSlideChange('next'); // Swipe left = next  
      }
    }
  }

  // Keyboard navigation
  onKeyDown(event: KeyboardEvent): void {
    if (this.isTransitioning) return;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.manualSlideChange('prev');
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.manualSlideChange('next');
        break;
      case ' ':
      case 'Spacebar':
        event.preventDefault();
        this.toggleAutoPlay();
        break;
      case 'Home':
        event.preventDefault();
        this.manualSlideChange(0);
        break;
      case 'End':
        event.preventDefault();
        this.manualSlideChange(this.heroSlides.length - 1);
        break;
    }
  }

  // Enhanced slide management
  startAutoSlide(): void {
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
    }
    
    if (this.autoPlay) {
      this.slideTimer = setInterval(() => {
        this.nextSlide();
      }, this.slideInterval);
    }
  }

  toggleAutoPlay(): void {
    this.autoPlay = !this.autoPlay;
    if (this.autoPlay) {
      this.startAutoSlide();
    } else {
      if (this.slideTimer) {
        clearInterval(this.slideTimer);
      }
    }
  }

  manualSlideChange(direction: 'next' | 'prev' | number): void {
    if (this.isTransitioning) return;
    
    // Stop auto-play temporarily
    this.autoPlay = false;
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
    }

    this.isTransitioning = true;

    if (typeof direction === 'number') {
      this.goToSlide(direction);
    } else if (direction === 'next') {
      this.nextSlide();
    } else {
      this.previousSlide();
    }

    // Re-enable transitions after animation
    setTimeout(() => {
      this.isTransitioning = false;
    }, 800);

    // Restart auto-play after user inactivity
    setTimeout(() => {
      if (!this.autoPlay) {
        this.autoPlay = true;
        this.startAutoSlide();
      }
    }, 8000);
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.heroSlides.length;
  }

  previousSlide(): void {
    this.currentSlide = this.currentSlide === 0 
      ? this.heroSlides.length - 1 
      : this.currentSlide - 1;
  }

  goToSlide(index: number): void {
    if (index >= 0 && index < this.heroSlides.length) {
      this.currentSlide = index;
    }
  }

  getNextSlideIndex(): number {
    return (this.currentSlide + 1) % this.heroSlides.length;
  }

  getPrevSlideIndex(): number {
    return this.currentSlide === 0 
      ? this.heroSlides.length - 1 
      : this.currentSlide - 1;
  }

  // Enhanced navigation methods
  navigateTo(route: string): void {
    console.log('Navigating to:', route);
    // Add loading state or transition effect here
    alert(`Would navigate to: ${route}`);
  }

  // Enhanced product helpers
  getProductIcon(productTitle: string): string {
    switch (productTitle.toLowerCase()) {
      case 'obd tracker':
        return 'settings';
      case 'fleet tracker':
        return 'local_shipping';
      case 'pet tracker':
        return 'pets';
      case 'dash cam':
        return 'videocam';
      case 'v7 pro 4g dual dash cam':
        return 'videocam';
      case 'smarter tracking starts here':
        return 'gps_fixed';
      case 'fleet management solutions':
        return 'business';
      case 'pet safety tracking':
        return 'pets';
      default:
        return 'gps_fixed';
    }
  }

  getProductTags(productTitle: string): string[] {
    switch (productTitle.toLowerCase()) {
      case 'obd tracker':
        return ['Real-time', 'Diagnostics', 'Easy Setup'];
      case 'fleet tracker':
        return ['Enterprise', '24/7 Support', 'Scalable'];
      case 'pet tracker':
        return ['Waterproof', 'Long Battery', 'Safe Zones'];
      case 'dash cam':
        return ['HD Video', 'AI Detection', 'Cloud Storage'];
      default:
        return ['Reliable', 'Secure', 'Easy to Use'];
    }
  }
}