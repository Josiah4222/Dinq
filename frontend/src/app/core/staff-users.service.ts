import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

/** A staff account, as /api/staff/users/ returns it. */
export interface StaffUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isSuperuser: boolean;
  isActive: boolean;
  /** ISO datetime the account was created. */
  dateJoined: string;
  /** ISO datetime of the last sign-in, or null if never. */
  lastLogin: string | null;
}

export interface StaffUserListResponse {
  results: StaffUser[];
}

/** The writable fields, sent on create. */
export interface StaffUserInput {
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  password: string;
  isSuperuser: boolean;
}

/** A 400 from a create: `detail` plus per-field messages. */
export interface StaffUserMutationError {
  detail: string;
  errors?: Record<string, string[]>;
}

/**
 * Staff-account management for /admin/team.
 *
 * Calls do NOT set SKIP_AUTH_REDIRECT: a 403 means the session ended (or the
 * user is not a superuser), and the interceptor's redirect is the right answer.
 */
@Injectable({ providedIn: 'root' })
export class StaffUsersService {
  private readonly http = inject(HttpClient);

  /** Every staff account, by username. */
  list(): Observable<StaffUserListResponse> {
    return this.http.get<StaffUserListResponse>('/api/staff/users/');
  }

  /** Create a staff account; the new user is returned. */
  create(input: StaffUserInput): Observable<{ user: StaffUser }> {
    return this.http.post<{ user: StaffUser }>('/api/staff/users/', input);
  }
}
