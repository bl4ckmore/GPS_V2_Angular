import { Injectable } from '@angular/core';
import { BaseEcService } from './base-ec.service';

export interface Cart { id: number; /* add fields */ }

@Injectable({ providedIn: 'root' })
export class CartsService extends BaseEcService {
  list() { return this.http.get<Cart[]>(`${this.base}/Carts`); }
  get(id: number) { return this.http.get<Cart>(`${this.base}/Carts/${id}`); }
  create(dto: Partial<Cart>) { return this.http.post<Cart>(`${this.base}/Carts`, dto); }
  delete(id: number) { return this.http.delete<void>(`${this.base}/Carts/${id}`); }
}
