import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { environment } from '../..//environments/environment';

export interface Product {
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
  updatedAt?: Date;
}

export interface ProductCategory {
  id: number;
  name: string;
  description: string;
  slug: string;
  icon: string;
  productCount: number;
  priceFrom: number;
}

export interface ProductFilters {
  category?: string;
  categoryId?: string;
  search?: string;
  searchTerm?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  page?: number;
  pageSize?: number;
  limit?: number;
  sortBy?: 'name' | 'price' | 'rating' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private baseUrl: string;
  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productsSubject.asObservable();

  constructor(private http: HttpClient) {
    const api = (environment.EC_API_BASE || '').replace(/\/+$/, '');
    this.baseUrl = `${api}/api/products`;
  }

  // ===== GET METHODS =====

  async getProducts(filters?: ProductFilters): Promise<ProductResponse> {
    try {
      let params = new HttpParams();

      if (filters) {
        if (filters.category) params = params.set('category', filters.category);
        if (filters.categoryId) params = params.set('categoryId', filters.categoryId);
        if (filters.search) params = params.set('search', filters.search);
        if (filters.searchTerm) params = params.set('searchTerm', filters.searchTerm);
        if (filters.minPrice) params = params.set('minPrice', filters.minPrice.toString());
        if (filters.maxPrice) params = params.set('maxPrice', filters.maxPrice.toString());
        if (filters.inStock !== undefined) params = params.set('inStock', filters.inStock.toString());
        if (filters.page) params = params.set('page', filters.page.toString());
        if (filters.pageSize) params = params.set('pageSize', filters.pageSize.toString());
        if (filters.limit) params = params.set('limit', filters.limit.toString());
        if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
        if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
      }

      const response = await firstValueFrom(
        this.http.get<ProductResponse>(this.baseUrl, { params })
      );

      this.productsSubject.next(response.products);
      return response;
    } catch (error) {
      console.error('Error fetching products:', error);
      // Return mock data as fallback
      const mockResponse = this.getMockProductResponse(filters);
      this.productsSubject.next(mockResponse.products);
      return mockResponse;
    }
  }

  async getProductById(id: number): Promise<Product> {
    try {
      return await firstValueFrom(
        this.http.get<Product>(`${this.baseUrl}/${id}`)
      );
    } catch (error) {
      console.error('Error fetching product:', error);
      // Return mock product as fallback
      return this.getMockProduct(id);
    }
  }

  async getFeaturedProducts(limit: number = 6): Promise<Product[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<Product[]>(`${this.baseUrl}/featured?limit=${limit}`)
      );
      return response;
    } catch (error) {
      console.error('Error fetching featured products:', error);
      return this.getMockFeaturedProducts().slice(0, limit);
    }
  }

  async getProductCategories(): Promise<ProductCategory[]> {
    try {
      return await firstValueFrom(
        this.http.get<ProductCategory[]>(`${this.baseUrl}/categories`)
      );
    } catch (error) {
      console.error('Error fetching product categories:', error);
      return this.getMockProductCategories();
    }
  }

  async getTotalProductCount(): Promise<number> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ count: number }>(`${this.baseUrl}/count`)
      );
      return response.count;
    } catch (error) {
      console.error('Error fetching product count:', error);
      return 42;
    }
  }

  // ===== ADMIN CRUD METHODS =====

  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    try {
      const product = await firstValueFrom(
        this.http.post<Product>(this.baseUrl, productData)
      );
      
      const currentProducts = this.productsSubject.value;
      this.productsSubject.next([...currentProducts, product]);
      
      return product;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async updateProduct(id: number, productData: Partial<Product>): Promise<Product> {
    try {
      const product = await firstValueFrom(
        this.http.put<Product>(`${this.baseUrl}/${id}`, productData)
      );
      
      const currentProducts = this.productsSubject.value;
      const updatedProducts = currentProducts.map(p => p.id === id ? product : p);
      this.productsSubject.next(updatedProducts);
      
      return product;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(id: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.baseUrl}/${id}`)
      );
      
      const currentProducts = this.productsSubject.value;
      const filteredProducts = currentProducts.filter(p => p.id !== id);
      this.productsSubject.next(filteredProducts);
      
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  async uploadProductImage(productId: number, imageFile: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await firstValueFrom(
        this.http.post<{ imageUrl: string }>(`${this.baseUrl}/${productId}/image`, formData)
      );
      
      return response.imageUrl;
    } catch (error) {
      console.error('Error uploading product image:', error);
      throw error;
    }
  }

  // ===== UTILITY METHODS =====

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  validateProduct(product: Partial<Product>): string[] {
    const errors: string[] = [];

    if (!product.name || product.name.trim().length < 3) {
      errors.push('Product name must be at least 3 characters long');
    }

    if (!product.description || product.description.trim().length < 10) {
      errors.push('Product description must be at least 10 characters long');
    }

    if (!product.price || product.price <= 0) {
      errors.push('Product price must be greater than 0');
    }

    if (!product.category || product.category.trim().length === 0) {
      errors.push('Product category is required');
    }

    if (product.stock === undefined || product.stock < 0) {
      errors.push('Product stock must be 0 or greater');
    }

    return errors;
  }

  // ===== MOCK DATA METHODS =====

  private getMockProductResponse(filters?: ProductFilters): ProductResponse {
    const allProducts = this.getMockFeaturedProducts();
    let filteredProducts = [...allProducts];

    // Apply filters
    if (filters?.search || filters?.searchTerm) {
      const searchTerm = (filters.search || filters.searchTerm || '').toLowerCase();
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm) || 
        p.description.toLowerCase().includes(searchTerm)
      );
    }

    if (filters?.category || filters?.categoryId) {
      const category = filters.category || filters.categoryId;
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }

    if (filters?.minPrice) {
      filteredProducts = filteredProducts.filter(p => p.price >= filters.minPrice!);
    }

    if (filters?.maxPrice) {
      filteredProducts = filteredProducts.filter(p => p.price <= filters.maxPrice!);
    }

    // Apply pagination
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || filters?.limit || 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
      products: filteredProducts.slice(startIndex, endIndex),
      total: filteredProducts.length,
      page: page,
      totalPages: Math.ceil(filteredProducts.length / pageSize)
    };
  }

  private getMockProduct(id: number): Product {
    const products = this.getMockFeaturedProducts();
    return products.find(p => p.id === id) || products[0];
  }

  private getMockFeaturedProducts(): Product[] {
    return [
      {
        id: 1,
        name: 'Enterprise Fleet Tracker Pro',
        description: 'Advanced GPS tracking with real-time monitoring, comprehensive analytics, and enterprise-grade security for professional fleet management.',
        price: 299.99,
        imageUrl: '/assets/images/products/fleet-tracker-pro.jpg',
        category: 'fleet',
        stock: 25,
        features: ['Real-time Tracking', '24/7 Monitoring', 'Advanced Analytics', 'Geofencing', 'Driver Behavior'],
        rating: 4.8,
        reviewCount: 124,
        isActive: true,
        createdAt: new Date('2024-01-15')
      },
      {
        id: 2,
        name: 'OBD-II Smart Tracker',
        description: 'Complete vehicle diagnostics with GPS tracking, fuel monitoring, and driver behavior analysis for optimal fleet performance.',
        price: 149.99,
        imageUrl: '/assets/images/products/obd-tracker.jpg',
        category: 'obd',
        stock: 45,
        features: ['OBD-II Integration', 'Fuel Tracking', 'Driver Analytics', 'Engine Diagnostics'],
        rating: 4.6,
        reviewCount: 89,
        isActive: true,
        createdAt: new Date('2024-02-10')
      },
      {
        id: 3,
        name: 'Asset Security Tracker',
        description: 'High-security GPS tracking for valuable assets with 90-day battery life and military-grade encryption.',
        price: 199.99,
        imageUrl: '/assets/images/products/asset-tracker.jpg',
        category: 'asset',
        stock: 18,
        features: ['90-day Battery', 'Military Encryption', 'Waterproof IP67', 'Tamper Alerts'],
        rating: 4.9,
        reviewCount: 156,
        isActive: true,
        createdAt: new Date('2024-01-20')
      },
      {
        id: 4,
        name: 'Personal GPS Watch',
        description: 'Compact personal tracking device with SOS features and long battery life for personal safety.',
        price: 79.99,
        imageUrl: '/assets/images/products/personal-tracker.jpg',
        category: 'personal',
        stock: 62,
        features: ['SOS Button', '7-day Battery', 'Water Resistant', 'Two-way Calling'],
        rating: 4.4,
        reviewCount: 67,
        isActive: true,
        createdAt: new Date('2024-03-05')
      },
      {
        id: 5,
        name: 'Construction Equipment Tracker',
        description: 'Heavy-duty GPS tracker designed for construction equipment with theft protection and usage monitoring.',
        price: 349.99,
        imageUrl: '/assets/images/products/construction-tracker.jpg',
        category: 'asset',
        stock: 12,
        features: ['Heavy Duty Design', 'Theft Protection', 'Usage Monitoring', 'Remote Immobilization'],
        rating: 4.7,
        reviewCount: 43,
        isActive: true,
        createdAt: new Date('2024-02-25')
      },
      {
        id: 6,
        name: 'Motorcycle GPS Tracker',
        description: 'Compact waterproof tracker specifically designed for motorcycles with anti-theft features.',
        price: 129.99,
        imageUrl: '/assets/images/products/motorcycle-tracker.jpg',
        category: 'personal',
        stock: 28,
        features: ['Waterproof', 'Compact Design', 'Anti-theft', 'Mobile Alerts'],
        rating: 4.5,
        reviewCount: 92,
        isActive: true,
        createdAt: new Date('2024-03-10')
      }
    ];
  }

  private getMockProductCategories(): ProductCategory[] {
    return [
      {
        id: 1,
        name: 'Fleet Management',
        description: 'Professional fleet tracking solutions for businesses',
        slug: 'fleet',
        icon: 'local_shipping',
        productCount: 12,
        priceFrom: 199
      },
      {
        id: 2,
        name: 'OBD Trackers',
        description: 'Vehicle diagnostics with GPS tracking capabilities',
        slug: 'obd',
        icon: 'settings',
        productCount: 8,
        priceFrom: 99
      },
      {
        id: 3,
        name: 'Asset Tracking',
        description: 'Secure tracking for valuable equipment and assets',
        slug: 'asset',
        icon: 'security',
        productCount: 15,
        priceFrom: 149
      },
      {
        id: 4,
        name: 'Personal GPS',
        description: 'Personal safety and tracking devices',
        slug: 'personal',
        icon: 'person_pin_circle',
        productCount: 6,
        priceFrom: 79
      }
    ];
  }
}