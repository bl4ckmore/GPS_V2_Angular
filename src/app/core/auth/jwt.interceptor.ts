import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const jwt = localStorage.getItem('app_jwt');
    const apiBase = (environment.EC_API_BASE || '').replace(/\/+$/, '');
    const isApiCall = req.url.startsWith(apiBase) || req.url.includes('/api/');

    if (jwt && isApiCall) {
      req = req.clone({ setHeaders: { Authorization: `Bearer ${jwt}` } });
    }
    return next.handle(req);
  }
}
