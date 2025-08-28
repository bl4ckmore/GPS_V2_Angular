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

    // Only for direct WhatsGPS calls (none in current flow)
    const isWhatsGps = /\/(user|car|position|carFence)\//.test(req.url);

    let authReq = req;
    if (token && isWhatsGps) {
      const params = (authReq.params || new HttpParams()).set('token', token);
      authReq = authReq.clone({ params });
    }

    return next.handle(authReq).pipe(
      catchError(err => {
        const code = (err?.error && (err.error.ret || err.error.code)) || 0;
        if (code === -1001 || code === -1002) this.auth.logout();
        return throwError(() => err);
      })
    );
  }
}
