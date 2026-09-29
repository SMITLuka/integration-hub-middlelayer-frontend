import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Services call the backend with root-relative paths (e.g. `/mandators`). In development
 * `apiBaseUrl` is empty and `ng serve` proxies those paths to localhost:8080; in production
 * the frontend and backend are on different hosts, so the backend origin is prepended here,
 * in one place, instead of in every service.
 */
export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.apiBaseUrl || !req.url.startsWith('/')) {
    return next(req);
  }
  return next(req.clone({ url: environment.apiBaseUrl + req.url }));
};
