/**
 * Primes the Django CSRF cookie before the app renders.
 *
 * Django only issues `csrftoken` in response to a view that calls `get_token` —
 * the backend's `GET /api/auth/csrf/` exists for exactly that. Angular is
 * configured (in app.config.ts) to read that cookie and echo it in
 * `X-CSRFToken` on every mutating request, but with no cookie present it sends
 * no header and Django rejects the POST with 403. Running this at startup means
 * the cookie is in place before any form can be submitted, and it also fixes
 * staff sign-in, which had exactly the same problem.
 *
 * This deliberately uses `fetch` rather than Angular's `HttpClient`. The
 * interceptor chain is not reliably constructed yet while app initializers run,
 * and asking for it here can throw during bootstrap and leave a blank page.
 * Priming a cookie needs no DI, no interceptors and no error handling, so the
 * browser's own `fetch` is the simplest thing that cannot break startup.
 *
 * A failure is swallowed on purpose: if the backend is down the site should
 * still render, and the submit that follows will report the real error.
 */
export function primeCsrfCookie(): Promise<unknown> {
  return fetch('/api/auth/csrf/', { credentials: 'include' }).catch(() => undefined);
}
