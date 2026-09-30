import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService, SKIP_AUTH_REDIRECT } from './auth.service';

/**
 * Sends the session cookie with every API call and bounces unauthenticated
 * staff traffic to /login.
 *
 * Auth endpoints opt out with SKIP_AUTH_REDIRECT, otherwise a failed sign-in
 * would navigate away from the very error message the user needs to read.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isAuthCall = req.context.get(SKIP_AUTH_REDIRECT);

  // The session lives in a cookie, so credentials must be included.
  const authedReq = req.clone({ withCredentials: true });

  return next(authedReq).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 403 && !isAuthCall) {
        auth.clear();
        void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      }
      return throwError(() => err);
    })
  );
};
