import { Injectable } from '@angular/core';
import { BaseEcService } from './base-ec.service';

export interface Order { id: number; /* add fields you return */ }

@Injectable({ providedIn: 'root' })
export class OrdersService extends BaseEcService {
  list() { return this.http.get<Order[]>(`${this.base}/Orders`); }
  get(id: number) { return this.http.get<Order>(`${this.base}/Orders/${id}`); }
  create(dto: Partial<Order>) { return this.http.post<Order>(`${this.base}/Orders`, dto); }
}
