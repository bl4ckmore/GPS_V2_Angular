import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../services/api.service';
import { Order, CreateOrderDto, PagedResult } from '../models';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly endpoint = 'Orders';

  constructor(private apiService: ApiService) { }

  // Get all orders with pagination
  getOrders(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Observable<PagedResult<Order>> {
    return this.apiService.getPaged<Order>(this.endpoint, params);
  }

  // Get single order by ID
  getOrder(id: string): Observable<Order> {
    return this.apiService.get<Order>(`${this.endpoint}/${id}`);
  }

  // Create new order
  createOrder(order: CreateOrderDto): Observable<Order> {
    return this.apiService.post<Order>(this.endpoint, order);
  }

  // Update order status (admin function)
  updateOrderStatus(id: string, status: string): Observable<Order> {
    return this.apiService.put<Order>(`${this.endpoint}/${id}/status`, { status });
  }

  // Get order by order number
  getOrderByNumber(orderNumber: string): Observable<Order> {
    return this.apiService.get<Order>(`${this.endpoint}/number/${orderNumber}`);
  }

  // Cancel order
  cancelOrder(id: string): Observable<Order> {
    return this.apiService.put<Order>(`${this.endpoint}/${id}/cancel`, {});
  }
}