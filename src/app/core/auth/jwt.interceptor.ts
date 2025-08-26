import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const jwt = localStorage.getItem('app_jwt');
    if (jwt && req.url.includes('/api/')) {
      req = req.clone({ setHeaders: { Authorization: `Bearer ${jwt}` } });
    }
    return next.handle(req);
  }
}
