import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../services/api.service';
import { Category, CreateCategoryDto } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly endpoint = 'Categories';

  constructor(private apiService: ApiService) { }

  // Get all categories
  getCategories(): Observable<Category[]> {
    return this.apiService.get<Category[]>(this.endpoint);
  }

  // Get single category by ID
  getCategory(id: string): Observable<Category> {
    return this.apiService.get<Category>(`${this.endpoint}/${id}`);
  }

  // Get main categories (parent categories)
  getMainCategories(): Observable<Category[]> {
    return this.apiService.get<Category[]>(`${this.endpoint}/main`);
  }

  // Get subcategories by parent ID
  getSubCategories(parentId: string): Observable<Category[]> {
    return this.apiService.get<Category[]>(`${this.endpoint}/subcategories/${parentId}`);
  }

  // Get category hierarchy
  getCategoryHierarchy(): Observable<Category[]> {
    return this.apiService.get<Category[]>(`${this.endpoint}/hierarchy`);
  }

  // Create category (admin function)
  createCategory(category: CreateCategoryDto): Observable<Category> {
    return this.apiService.post<Category>(this.endpoint, category);
  }

  // Update category (admin function)
  updateCategory(id: string, category: Partial<CreateCategoryDto>): Observable<Category> {
    return this.apiService.put<Category>(`${this.endpoint}/${id}`, category);
  }

  // Delete category (admin function)
  deleteCategory(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }
}