import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { AuthService } from '..//core/auth/auth.service';
import { environment } from '../..//environments/environment';

export interface UserProfile {
  id: number;
  whatsGpsUserId: string; // ID from WhatsGPS system
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  preferences?: {
    notifications: boolean;
    newsletter: boolean;
    language: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface UserOrder {
  id: number;
  orderNumber: string;
  status: string;
  total: number;
  itemCount: number;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl: string;
  private userProfileSubject = new BehaviorSubject<UserProfile | null>(null);
  
  public userProfile$ = this.userProfileSubject.asObservable();

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {
    const api = (environment.EC_API_BASE || '').replace(/\/+$/, '');
    this.baseUrl = `${api}/api/users`;

    // Load user profile when logged in
    this.auth.isLoggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.loadUserProfile();
      } else {
        this.userProfileSubject.next(null);
      }
    });
  }

  // ===== USER PROFILE MANAGEMENT =====

  async loadUserProfile(): Promise<UserProfile | null> {
    const isLoggedIn = this.auth.isLoggedIn$.value;
    if (!isLoggedIn) {
      return null;
    }

    try {
      const profile = await firstValueFrom(
        this.http.get<UserProfile>(`${this.baseUrl}/profile`)
      );
      
      this.userProfileSubject.next(profile);
      return profile;
    } catch (error: any) {
      console.error('Error loading user profile:', error);
      
      // If profile doesn't exist (404), create one from auth data
      if (error?.status === 404) {
        return await this.createUserProfile();
      }
      
      throw error;
    }
  }

  private async createUserProfile(): Promise<UserProfile> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }

    try {
      const profileData = {
        whatsGpsUserId: currentUser.id?.toString() || '',
        name: currentUser.name || '',
        email: currentUser.email || '',
        isActive: true
      };

      const profile = await firstValueFrom(
        this.http.post<UserProfile>(`${this.baseUrl}/profile`, profileData)
      );
      
      this.userProfileSubject.next(profile);
      return profile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    const isLoggedIn = this.auth.isLoggedIn$.value;
    if (!isLoggedIn) {
      throw new Error('Please sign in to update profile');
    }

    try {
      const profile = await firstValueFrom(
        this.http.put<UserProfile>(`${this.baseUrl}/profile`, profileData)
      );
      
      this.userProfileSubject.next(profile);
      return profile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async deleteUserProfile(): Promise<void> {
    const isLoggedIn = this.auth.isLoggedIn$.value;
    if (!isLoggedIn) {
      throw new Error('Please sign in to delete profile');
    }

    try {
      await firstValueFrom(
        this.http.delete(`${this.baseUrl}/profile`)
      );
      
      this.userProfileSubject.next(null);
    } catch (error) {
      console.error('Error deleting user profile:', error);
      throw error;
    }
  }

  // ===== ORDER HISTORY =====

  async getUserOrders(page: number = 1, limit: number = 10): Promise<{ orders: UserOrder[]; total: number }> {
    const isLoggedIn = this.auth.isLoggedIn$.value;
    if (!isLoggedIn) {
      throw new Error('Please sign in to view orders');
    }

    try {
      const response = await firstValueFrom(
        this.http.get<{ orders: UserOrder[]; total: number }>(`${this.baseUrl}/orders`, {
          params: { page: page.toString(), limit: limit.toString() }
        })
      );
      
      return response;
    } catch (error) {
      console.error('Error loading user orders:', error);
      return { orders: [], total: 0 };
    }
  }

  async getUserOrder(orderId: number): Promise<any> {
    const isLoggedIn = this.auth.isLoggedIn$.value;
    if (!isLoggedIn) {
      throw new Error('Please sign in to view order details');
    }

    try {
      return await firstValueFrom(
        this.http.get<any>(`${this.baseUrl}/orders/${orderId}`)
      );
    } catch (error) {
      console.error('Error loading order details:', error);
      throw error;
    }
  }

  // ===== ADDRESS MANAGEMENT =====

  async getUserAddresses(): Promise<any[]> {
    const isLoggedIn = this.auth.isLoggedIn$.value;
    if (!isLoggedIn) {
      return [];
    }

    try {
      return await firstValueFrom(
        this.http.get<any[]>(`${this.baseUrl}/addresses`)
      );
    } catch (error) {
      console.error('Error loading user addresses:', error);
      return [];
    }
  }

  async addUserAddress(address: any): Promise<any> {
    const isLoggedIn = this.auth.isLoggedIn$.value;
    if (!isLoggedIn) {
      throw new Error('Please sign in to add address');
    }

    try {
      return await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/addresses`, address)
      );
    } catch (error) {
      console.error('Error adding user address:', error);
      throw error;
    }
  }

  async updateUserAddress(addressId: number, address: any): Promise<any> {
    const isLoggedIn = this.auth.isLoggedIn$.value;
    if (!isLoggedIn) {
      throw new Error('Please sign in to update address');
    }

    try {
      return await firstValueFrom(
        this.http.put<any>(`${this.baseUrl}/addresses/${addressId}`, address)
      );
    } catch (error) {
      console.error('Error updating user address:', error);
      throw error;
    }
  }

  async deleteUserAddress(addressId: number): Promise<void> {
    const isLoggedIn = this.auth.isLoggedIn$.value;
    if (!isLoggedIn) {
      throw new Error('Please sign in to delete address');
    }

    try {
      await firstValueFrom(
        this.http.delete(`${this.baseUrl}/addresses/${addressId}`)
      );
    } catch (error) {
      console.error('Error deleting user address:', error);
      throw error;
    }
  }

  // ===== PREFERENCES =====

  async updateUserPreferences(preferences: any): Promise<UserProfile> {
    const isLoggedIn = this.auth.isLoggedIn$.value;
    if (!isLoggedIn) {
      throw new Error('Please sign in to update preferences');
    }

    try {
      const profile = await firstValueFrom(
        this.http.put<UserProfile>(`${this.baseUrl}/preferences`, preferences)
      );
      
      this.userProfileSubject.next(profile);
      return profile;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  // ===== UTILITY METHODS =====

  get currentUserProfile(): UserProfile | null {
    return this.userProfileSubject.value;
  }

  validateUserProfile(profile: Partial<UserProfile>): string[] {
    const errors: string[] = [];

    if (!profile.name || profile.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }

    if (profile.email && !this.isValidEmail(profile.email)) {
      errors.push('Please enter a valid email address');
    }

    if (profile.phone && !this.isValidPhone(profile.phone)) {
      errors.push('Please enter a valid phone number');
    }

    return errors;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  // ===== SYNC WITH WHATSGPS =====

  async syncWithWhatsGPS(): Promise<void> {
    const isLoggedIn = this.auth.isLoggedIn$.value;
    if (!isLoggedIn) {
      throw new Error('Please sign in to sync data');
    }

    try {
      await firstValueFrom(
        this.http.post(`${this.baseUrl}/sync-whatsgps`, {})
      );
      
      // Reload profile after sync
      await this.loadUserProfile();
    } catch (error) {
      console.error('Error syncing with WhatsGPS:', error);
      throw error;
    }
  }
}