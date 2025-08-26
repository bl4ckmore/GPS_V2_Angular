import { Injectable } from '@angular/core';
import { BaseEcService } from './base-ec.service';

export interface Category { id: number; name: string; }

@Injectable({ providedIn: 'root' })
export class CategoriesService extends BaseEcService {
  list() { return this.http.get<Category[]>(`${this.base}/Categories`); }
  get(id: number) { return this.http.get<Category>(`${this.base}/Categories/${id}`); }
  create(dto: Partial<Category>) { return this.http.post<Category>(`${this.base}/Categories`, dto); }
  update(id: number, dto: Partial<Category>) { return this.http.put<Category>(`${this.base}/Categories/${id}`, dto); }
  delete(id: number) { return this.http.delete<void>(`${this.base}/Categories/${id}`); }
}
