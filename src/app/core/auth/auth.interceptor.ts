import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Adds the SSO access token to calls to our backend. Backend calls are the
 * root-relative ones (`/mandators`, ...), so this must run before apiBaseUrlInterceptor
 * turns them into absolute URLs; absolute and protocol-relative URLs (`//host/...`, other
 * hosts) never receive the token. A 401 is handed to AuthService.handleUnauthorized().
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/') || req.url.startsWith('//')) {
    return next(req);
  }
  const auth = inject(AuthService);
  const token = auth.getAccessToken();
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        auth.handleUnauthorized();
      }
      return throwError(() => error);
    }),
  );
};
