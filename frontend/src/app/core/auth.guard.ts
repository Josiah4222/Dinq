import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthService, AuthUser } from './auth.service';

/**
 * Protects staff-only routes.
 *
 * On a cold page load the session is unknown, so `refreshSession()` is awaited
 * before deciding. A signed-in staff user passes through; everyone else is sent
 * to /login with a `returnUrl` so they land back where they were headed.
 */
export const staffGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isSignedIn()) {
    return true;
  }

  return auth.refreshSession().pipe(
    take(1),
    map(user => {
      if (user) {
        return true;
      }
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      });
    })
  );
};

/** Keeps a signed-in staff user off the login page. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isSignedIn()) {
    return router.createUrlTree(['/admin']);
  }
  return true;
};

/**
 * Protects superuser-only staff routes (currently /admin/team).
 *
 * A signed-in non-superuser is turned back to the dashboard rather than the
 * login page: they are legitimately signed in, they just cannot manage staff.
 * The server enforces the same rule, so this only keeps the UI honest.
 */
export const superuserGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const decide = (user: AuthUser | null) =>
    user?.isSuperuser ? true : router.createUrlTree(['/admin']);

  if (auth.isSignedIn()) {
    return decide(auth.user());
  }

  return auth.refreshSession().pipe(take(1), map(decide));
};
