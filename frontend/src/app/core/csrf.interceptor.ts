import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Observable, catchError, from, switchMap, throwError } from 'rxjs';

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
let csrfInFlight: Promise<void> | null = null;

function getCsrfToken(): Promise<void> {
  if (!csrfInFlight) {
    csrfInFlight = fetch('/api/auth/csrf/', { credentials: 'include' })
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        csrfInFlight = null;
      });
  }
  return csrfInFlight;
}

function isApiRequest(url: string): boolean {
  return url.startsWith('/api/');
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function addCsrfHeader(req: any) {
  const token = getCookie('csrftoken');
  return req.clone({
    setHeaders: token ? { 'X-CSRFToken': token } : {},
    withCredentials: true,
  });
}

function isCsrfFailure(err: HttpErrorResponse): boolean {
  // Only retry for CSRF failures, not permission errors
  if (err.status !== 403) {
    return false;
  }
  // Check common CSRF indicators
  const body: any = err.error;
  if (body && typeof body === 'object') {
    const detail = body.detail || body.message || body.reason;
    if (typeof detail === 'string') {
      const d = detail.toLowerCase();
      if (d.includes('csrf')) {
        return true;
      }
      // Django's default CSRF failure often says "CSRF verification failed"
      if (d.includes('verification failed')) {
        return true;
      }
    }
  }
  if (typeof body === 'string') {
    const b = body.toLowerCase();
    if (b.includes('csrf') || b.includes('verification failed')) {
      return true;
    }
  }
  // Check headers sometimes set by Django
  const reason = err.headers?.get?.('x-csrftoken') || err.headers?.get?.('X-CSRFToken');
  // Also sometimes Django adds reason in header? Uncommon. Be conservative:
  // If it's a generic permission error like "Not signed in." from our API, don't retry
  if (body && typeof body === 'object' && body.detail === 'Not signed in.') {
    return false;
  }
  // For our API endpoints, permission denials are usually explicit; CSRF failures from Django
  // middleware may come as HTML or different format. Try to be more specific - check if it's from CSRF middleware
  // by looking at URL patterns? Or just be conservative - only retry if clearly CSRF
  // But per requirement: "refresh and retry only when the 403 response body indicates a CSRF failure"
  // If no clear indication, don't retry
  return false;
}

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (!UNSAFE_METHODS.has(req.method) || !isApiRequest(req.url)) {
    return next(req);
  }

  // Don't add retry logic to csrf endpoint itself
  if (req.url.includes('/api/auth/csrf/')) {
    return next(req);
  }

  const token = getCookie('csrftoken');
  if (token) {
    return next(addCsrfHeader(req)).pipe(
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse && isCsrfFailure(err)) {
          return from(getCsrfToken()).pipe(
            switchMap(() => next(addCsrfHeader(req)).pipe(
              catchError((e2: unknown) => throwError(() => e2))
            ))
          );
        }
        return throwError(() => err);
      })
    );
  }

  return from(getCsrfToken()).pipe(
    switchMap(() => {
      return next(addCsrfHeader(req)).pipe(
        catchError((err: unknown) => {
          if (err instanceof HttpErrorResponse && isCsrfFailure(err)) {
            return from(getCsrfToken()).pipe(
              switchMap(() => next(addCsrfHeader(req)))
            );
          }
          return throwError(() => err);
        })
      );
    })
  );
};
