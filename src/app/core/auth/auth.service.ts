import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'app_jwt';
  private userKey  = 'app_user';

  isLoggedIn$ = new BehaviorSubject<boolean>(!!this.token);
  roleId$     = new BehaviorSubject<number>(this.currentRoleId);

  constructor(private http: HttpClient, private router: Router) {}

  get token(): string | null { return localStorage.getItem(this.tokenKey); }
  get currentUser(): any { const raw = localStorage.getItem(this.userKey); return raw ? JSON.parse(raw) : null; }
  get currentRoleId(): number {
    try {
      const payload = this.decodeJwt(this.token || '');
      const r = payload?.roleId ? Number(payload.roleId) : NaN;
      return Number.isFinite(r) ? r : 1;
    } catch { return 1; }
  }
  get isAdmin(): boolean { return this.currentRoleId === 2; }

  async login(name: string, password: string, lang: string = 'en'): Promise<void> {
    const api = (environment.EC_API_BASE || '').replace(/\/+$/, '');
    const url = `${api}/auth/whatsgps/login`;

    const tzSeconds = -new Date().getTimezoneOffset() * 60;
    const res = await firstValueFrom(this.http.post<any>(url, { name, password, lang, timeZoneSecond: tzSeconds }));

    const jwt = res?.jwt as string | undefined;
    if (!jwt) throw new Error('Login failed (no jwt)');

    localStorage.setItem(this.tokenKey, jwt);
    localStorage.setItem(this.userKey, JSON.stringify(res?.user ?? { name }));

    this.isLoggedIn$.next(true);
    this.roleId$.next(this.currentRoleId);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.isLoggedIn$.next(false);
    this.roleId$.next(1);
    this.router.navigate(['/sign-in']);
  }

  // decode JWT payload
  private decodeJwt(token: string): any | null {
    if (!token) return null;
    const p = token.split('.')[1];
    if (!p) return null;
    const json = atob(p.replace(/-/g,'+').replace(/_/g,'/'));
    return JSON.parse(json);
  }
}
