import { Injectable } from '@angular/core';
import { BaseEcService } from './base-ec.service';

export interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductsService extends BaseEcService {
  list() { return this.http.get<Product[]>(`${this.base}/Products`); }
  get(id: number) { return this.http.get<Product>(`${this.base}/Products/${id}`); }
  create(dto: Partial<Product>) { return this.http.post<Product>(`${this.base}/Products`, dto); }
  update(id: number, dto: Partial<Product>) { return this.http.put<Product>(`${this.base}/Products/${id}`, dto); }
  delete(id: number) { return this.http.delete<void>(`${this.base}/Products/${id}`); }
}
