import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { ProfileService } from './core/auth/profile.service';
import { authInterceptor } from './core/auth/auth.interceptor';
import { apiBaseUrlInterceptor } from './core/interceptors/api-base-url.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, apiBaseUrlInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
    // Nothing renders before the user is logged in with Bitrix (or a login error is known), and the
    // user's rights are known, so the UI shows the right actions from the first paint.
    provideAppInitializer(async () => {
      const auth = inject(AuthService);
      const profile = inject(ProfileService);
      await auth.init();
      if (!auth.error() && !auth.signedOut()) {
        // A failed load only hides actions; the request itself (401/403) is handled by the interceptors.
        await profile.load().catch(() => undefined);
      }
    }),
  ],
};
