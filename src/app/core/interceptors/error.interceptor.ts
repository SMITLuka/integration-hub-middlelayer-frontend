import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { ErrorResponse } from '../models/api-error.model';
import { ProfileService } from '../auth/profile.service';

/**
 * Set on a request's `HttpContext` to suppress the automatic error snackbar,
 * e.g. for an expected 404 when a caller probes for an entity that may not
 * exist yet (a template editor's first load).
 */
export const SUPPRESS_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

/**
 * Extracts the human-readable `description` from the backend's error envelope
 * (`{"error": {"code": ..., "description": ...}}`) and shows it via MatSnackBar,
 * then rethrows the original error so callers can still react if needed.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const profile = inject(ProfileService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401: the auth interceptor is already sending the user to the portal.
      // 403 before the profile is loaded: the user has no access at all, which the no-access page shows.
      const noAccess = error.status === 403 && !profile.user();
      if (!req.context.get(SUPPRESS_ERROR_TOAST) && error.status !== 401 && !noAccess) {
        const body = error.error as ErrorResponse | undefined;
        const description =
          body?.error?.description ??
          (error.status === 403 ? 'You do not have permission for this action.' : 'An unexpected error occurred.');
        snackBar.open(description, 'Dismiss', { duration: 6000 });
      }
      return throwError(() => error);
    }),
  );
};
