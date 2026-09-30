import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

/** Shared `Submission.status` values, mirroring Django's TextChoices. */
export type SubmissionStatus = 'new' | 'in_progress' | 'closed' | 'spam';

/** Which form produced a contact row. Mirrors Django's `ContactSubmission.Source`. */
export type ContactSource = 'contact' | 'quick_inquiry';

export interface StaffContactSubmission {
  id: number;
  reference: string;
  createdAt: string;
  status: SubmissionStatus;
  notes: string;
  /** When someone first opened this, or null. Absent means unread. */
  seenAt: string | null;
  /** Which form this came from. Both forms share one table. */
  source: ContactSource;
  /** The submitter agreed to be contacted. Staff-only: never echoed back. */
  consent: boolean;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  company: string;
  clientType: string;
  reasonForContact: string;
  areasOfInterest: string[];
  preferredDate: string | null;
  message: string;
}

/**
 * True while a submission is still worth flagging as new.
 *
 * The pill renders the status, but `new` on a row somebody has already opened
 * is not information: it says "unseen", not "where this got to". So a seen row
 * drops the pill rather than showing a grey `new`, and the pill returns on its
 * own once staff move the status on in the Django admin. Opening a submission
 * therefore clears the notification without touching the workflow.
 */
export function isUnread(row: Pick<StaffContactSubmission, 'status' | 'seenAt'>): boolean {
  return row.status === 'new' && !row.seenAt;
}

export interface StaffPropertyLead {
  id: number;
  reference: string;
  createdAt: string;
  status: SubmissionStatus;
  notes: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  propertyInterest: string;
  message: string;
}

export interface StaffSubscriber {
  id: number;
  createdAt: string;
  email: string;
  isActive: boolean;
  unsubscribedAt: string | null;
}

interface ListResponse<T> {
  count: number;
  results: T[];
}

interface SubscriberListResponse extends ListResponse<StaffSubscriber> {
  activeCount: number;
}

/**
 * Row counts per submission type.
 *
 * Separate from the lists because the sidebar shows all three on every staff
 * screen, including where a list is never opened. These numbers are also the
 * authority the inbox labels its own sections with, so the sidebar and the
 * content pane cannot show different totals for the same thing.
 */
export interface SubmissionCounts {
  /** Full consultation requests, `source=contact`. */
  contacts: number;
  /** Short-form messages, `source=quick_inquiry`. */
  quickInquiries: number;
  /** Every contact row, the two kinds added together. */
  contactsTotal: number;
  propertyLeads: number;
  newsletter: number;
  newsletterActive: number;
}

/**
 * Read-only access to stored submissions for the /staff screen.
 *
 * These calls intentionally do NOT set SKIP_AUTH_REDIRECT, so a 403 sends the
 * user to /login — that is the correct behaviour for a staff-only screen,
 * unlike the public form writes.
 */
@Injectable({ providedIn: 'root' })
export class StaffSubmissionsService {
  private readonly http = inject(HttpClient);

  counts(): Observable<SubmissionCounts> {
    return this.http.get<SubmissionCounts>('/api/staff/submissions/counts/');
  }

  /**
   * Contact rows, optionally narrowed to one of the two forms.
   *
   * Omitting `source` returns every contact row, which is what a screen wanting
   * the undivided picture asks for. Passing one of them is what lets the quick
   * inquiry queue and the consultation queue be worked separately even though
   * they are stored in the same table.
   */
  listContacts(source?: ContactSource): Observable<ListResponse<StaffContactSubmission>> {
    const url = '/api/staff/submissions/contact/';
    return this.http.get<ListResponse<StaffContactSubmission>>(
      source ? `${url}?source=${source}` : url,
    );
  }

  /**
   * One contact row in full, for the screen opened from a list.
   *
   * The lists carry only what is needed to recognise a row, so the message and
   * the rest are fetched when one is actually opened. `source` is sent so a
   * detail opened from the quick inquiry queue cannot come back as a full
   * consultation; the server treats a mismatch as not found.
   */
  getContact(id: number, source: ContactSource): Observable<StaffContactSubmission> {
    return this.http.get<StaffContactSubmission>(
      `/api/staff/submissions/contact/${id}/?source=${source}`,
    );
  }

  /**
   * Tell the server this submission has been opened, so it stops counting as
   * unread.
   *
   * Only the first view writes anything, so calling this on every render is
   * harmless and keeps the screen from having to work out whether it has already
   * said so. It deliberately does not touch `status`: reading a message is not
   * the same as starting the work, and the server keeps those two apart.
   */
  markContactSeen(id: number, source: ContactSource): Observable<StaffContactSubmission> {
    return this.http.post<StaffContactSubmission>(
      `/api/staff/submissions/contact/${id}/seen/?source=${source}`,
      {},
    );
  }

  listPropertyLeads(): Observable<ListResponse<StaffPropertyLead>> {
    return this.http.get<ListResponse<StaffPropertyLead>>(
      '/api/staff/submissions/property-lead/',
    );
  }

  listSubscribers(): Observable<SubscriberListResponse> {
    return this.http.get<SubscriberListResponse>('/api/staff/submissions/newsletter/');
  }
}
