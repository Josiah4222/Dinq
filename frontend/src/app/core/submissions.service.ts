import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SKIP_AUTH_REDIRECT } from './auth.service';

/**
 * Public form endpoints for the contact, property-lead and newsletter forms.
 *
 * Writes are anonymous, so they opt out of the auth interceptor's 403
 * redirect: a visitor whose form was rejected (bad input, or a CSRF token that
 * had not been primed yet) must never be sent to the staff sign-in page.
 *
 * Staff reads live in `StaffSubmissionsService` — they are session-gated and
 * deliberately kept out of the public surface.
 */
export interface SubmissionAccepted {
  reference: string;
  detail: string;
}

export interface NewsletterAccepted {
  detail: string;
  alreadySubscribed: boolean;
}

/** Field errors as Django returns them: `{field: [message, ...]}`. */
export type FieldErrors = Record<string, string[]>;

@Injectable({ providedIn: 'root' })
export class SubmissionsService {
  private readonly http = inject(HttpClient);

  /** Keeps the interceptor from redirecting an anonymous submitter to /login. */
  private readonly anonymous = new HttpContext().set(SKIP_AUTH_REDIRECT, true);

  submitContact(payload: unknown): Observable<SubmissionAccepted> {
    return this.http.post<SubmissionAccepted>('/api/submissions/contact/', payload, {
      context: this.anonymous,
    });
  }

  /**
   * Post a quick inquiry.
   *
   * The payload is the same shape the /contact form sends, because it is the
   * same action -- storing a contact enquiry -- and it is deliberately not given
   * a backend of its own. What differs is the source, so staff can tell the two
   * kinds apart without the API learning about a second form.
   */
  /**
   * Send a quick inquiry.
   *
   * Its own endpoint rather than the /contact one, because the short form is
   * genuinely a different set of rules: a message is not required, and a phone
   * number or an email address is enough. Both forms are stored in the same
   * place, so staff read them together.
   */
  submitQuickInquiry(payload: unknown): Observable<SubmissionAccepted> {
    return this.http.post<SubmissionAccepted>('/api/submissions/quick-inquiry/', payload, {
      context: this.anonymous,
    });
  }

  submitPropertyLead(payload: unknown): Observable<SubmissionAccepted> {
    return this.http.post<SubmissionAccepted>('/api/submissions/property-lead/', payload, {
      context: this.anonymous,
    });
  }

  subscribeNewsletter(email: string): Observable<NewsletterAccepted> {
    return this.http.post<NewsletterAccepted>('/api/submissions/newsletter/', { email }, {
      context: this.anonymous,
    });
  }
}
