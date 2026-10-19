import { HttpClient, HttpContext, HttpContextToken } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';

/** Shape returned by GET /api/auth/me/ and POST /api/auth/login/. */
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isStaff: boolean;
  isSuperuser: boolean;
}

/** Marks a request as auth-related so the 401 handler can skip the redirect. */
export const SKIP_AUTH_REDIRECT = new HttpContextToken<boolean>(() => false);

/**
 * Session state, backed by Django's `sessionid` cookie.
 *
 * The cookie is a cookie: this service keeps a signal mirror of it so templates
 * can read synchronously, and re-syncs from the server on load rather than
 * trusting anything persisted locally.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly currentUser = signal<AuthUser | null>(null);
  private readonly checked = signal(false);

  /** The signed-in staff user, or null. */
  readonly user = this.currentUser.asReadonly();
  readonly isSignedIn = computed(() => this.currentUser() !== null);
  /** True once a check has run, so callers can tell "loading" from "signed out". */
  readonly isChecked = this.checked.asReadonly();

  /**
   * Ask Django whether the session cookie is valid. Called once at startup.
   * "Not signed in" is a normal answer rather than an error, so a 403 is mapped
   * to null instead of surfacing as a failed request.
   */
  refreshSession(): Observable<AuthUser | null> {
    return this.http
      .get<{ user: AuthUser }>('/api/auth/me/', {
        context: new HttpContext().set(SKIP_AUTH_REDIRECT, true),
      })
      .pipe(
        map(res => res.user),
        catchError(() => of(null)),
        tap(user => {
          this.currentUser.set(user);
          this.checked.set(true);
        })
      );
  }

  /**
   * Sign in. On success the server sets the session cookie, so nothing secret is
   * handed to or stored by the client.
   */
  login(username: string, password: string): Observable<AuthUser> {
    return this.http
      .post<{ user: AuthUser }>('/api/auth/login/', { username, password }, {
        context: new HttpContext().set(SKIP_AUTH_REDIRECT, true),
      })
      .pipe(
        map(res => res.user),
        tap(user => {
          this.currentUser.set(user);
          this.checked.set(true);
        })
      );
  }

  /** Sign out and drop local state. */
  logout(): Observable<unknown> {
    return this.http
      .post<{ detail: string }>('/api/auth/logout/', {}, {
        context: new HttpContext().set(SKIP_AUTH_REDIRECT, true),
      })
      .pipe(
        tap({
          next: () => this.clear(),
          error: () => this.clear(),
        })
      );
  }

  /**
   * Change the signed-in user's username. The response carries the fresh user
   * payload, which becomes the new local state so the rail and any other
   * chrome update without a second round trip.
   */
  updateUsername(username: string): Observable<AuthUser> {
    return this.http
      .post<{ user: AuthUser }>('/api/auth/profile/', { username })
      .pipe(
        map(res => res.user),
        tap(user => this.currentUser.set(user)),
      );
  }

  /**
   * Change the signed-in user's password. The current password is required
   * even though the session is already authenticated, and the session itself
   * is preserved by the backend so this succeeds without a forced re-login.
   */
  changePassword(currentPassword: string, newPassword: string): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>('/api/auth/password/', {
      currentPassword,
      newPassword,
    });
  }

  clear(): void {
    this.currentUser.set(null);
  }

  /** Display name for the signed-in user, falling back to the username. */
  displayName(): string {
    const user = this.currentUser();
    if (!user) {
      return '';
    }
    const full = [user.firstName, user.lastName].filter(Boolean).join(' ');
    return full || user.username;
  }
}
