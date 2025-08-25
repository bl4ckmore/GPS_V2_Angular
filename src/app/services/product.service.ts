import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../services/api.service';
import { Product, PagedResult, CreateProductDto } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly endpoint = 'Products';

  constructor(private apiService: ApiService) { }

  // Get all products with optional filtering and pagination
  getProducts(params?: {
    categoryId?: string;
    searchTerm?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Observable<PagedResult<Product>> {
    return this.apiService.getPaged<Product>(this.endpoint, params);
  }

  // Get single product by ID
  getProduct(id: string): Observable<Product> {
    return this.apiService.get<Product>(`${this.endpoint}/${id}`);
  }

  // Get featured products for home page
  getFeaturedProducts(limit: number = 8): Observable<Product[]> {
    return this.apiService.get<Product[]>(`${this.endpoint}/featured`, { limit });
  }

  // Get products by category
  getProductsByCategory(categoryId: string, params?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Observable<PagedResult<Product>> {
    return this.apiService.getPaged<Product>(`${this.endpoint}/category/${categoryId}`, params);
  }

  // Search products
  searchProducts(searchTerm: string, params?: {
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    pageSize?: number;
  }): Observable<PagedResult<Product>> {
    return this.apiService.getPaged<Product>(`${this.endpoint}/search`, { 
      searchTerm, 
      ...params 
    });
  }

  // Get related products
  getRelatedProducts(productId: string, limit: number = 4): Observable<Product[]> {
    return this.apiService.get<Product[]>(`${this.endpoint}/${productId}/related`, { limit });
  }

  // Create product (admin function)
  createProduct(product: CreateProductDto): Observable<Product> {
    return this.apiService.post<Product>(this.endpoint, product);
  }

  // Update product (admin function)
  updateProduct(id: string, product: Partial<CreateProductDto>): Observable<Product> {
    return this.apiService.put<Product>(`${this.endpoint}/${id}`, product);
  }

  // Delete product (admin function)
  deleteProduct(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }

  // Get product price range for filtering
  getPriceRange(categoryId?: string): Observable<{ min: number; max: number }> {
    const params = categoryId ? { categoryId } : {};
    return this.apiService.get<{ min: number; max: number }>(`${this.endpoint}/price-range`, params);
  }
}