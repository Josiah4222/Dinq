import { ApplicationConfig, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';
import { primeCsrfCookie } from './core/csrf.initializer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Fetches the Django `csrftoken` cookie before the app renders, so the
    // public forms and staff sign-in can POST. See csrf.initializer.ts.
    provideAppInitializer(primeCsrfCookie),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      })
    ),
    provideHttpClient(
      // Django names its CSRF cookie `csrftoken` and expects the token back in
      // `X-CSRFToken`; Angular's defaults are XSRF-TOKEN / X-XSRF-TOKEN.
      withXsrfConfiguration({ cookieName: 'csrftoken', headerName: 'X-CSRFToken' }),
      withInterceptors([authInterceptor])
    ),
  ],
};
