import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpParams, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.token;

    // WhatsGPS expects token as param on most requests; your ECommerce API typically uses none.
    // We’ll pass token as a query param only for WhatsGPS base URL.
    const isWhatsGps = req.url.includes('/user/') || req.url.includes('/car') || req.url.includes('/position') || req.url.includes('/carFence');

    let authReq = req;
    if (token && isWhatsGps) {
      let params = (authReq.params || new HttpParams()).set('token', token);
      authReq = authReq.clone({ params });
    }

    return next.handle(authReq).pipe(
      catchError(err => {
        // common WhatsGPS token errors
        const code = (err?.error && (err.error.ret || err.error.code)) || 0;
        if (code === -1001 || code === -1002) {
          this.auth.logout();
        }
        return throwError(() => err);
      })
    );
  }
}
