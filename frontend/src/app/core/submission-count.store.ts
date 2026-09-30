import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { Observable, Subject, finalize } from 'rxjs';
import { StaffSubmissionsService, SubmissionCounts } from './staff-submissions.service';

/** Which submission type a count belongs to, matching the sidebar item ids. */
export type CountKey = 'contacts' | 'quickInquiries' | 'propertyLeads' | 'newsletter';

/** How often a staff screen checks whether a submission has arrived. */
export const SUBMISSION_POLL_MS = 5_000;

const EMPTY: SubmissionCounts = {
  contacts: 0,
  quickInquiries: 0,
  contactsTotal: 0,
  propertyLeads: 0,
  newsletter: 0,
  newsletterActive: 0,
};

/** True when two count sets agree, field by field. */
function sameCounts(a: SubmissionCounts, b: SubmissionCounts): boolean {
  return (
    a.contacts === b.contacts &&
    a.quickInquiries === b.quickInquiries &&
    a.contactsTotal === b.contactsTotal &&
    a.propertyLeads === b.propertyLeads &&
    a.newsletter === b.newsletter &&
    a.newsletterActive === b.newsletterActive
  );
}

/**
 * The submission counts the staff sidebar shows, that the inbox headings quote,
 * and that tell a watching screen a new submission has arrived.
 *
 * Two things read these numbers, so they are held here rather than in whichever
 * component happens to render first. That is the point: the sidebar and the
 * content pane must not be able to disagree about how many submissions there
 * are, and the only way to guarantee that is one source.
 *
 * Counts start null rather than 0, so the sidebar can show nothing until the
 * number is known. Showing a confident 0 before the request lands reads as
 * "no submissions" and is worse than showing no badge.
 *
 * While at least one staff screen is watching, the counts are polled: a
 * submission arriving from the public site is invisible to an open tab until
 * something asks again, and staff reasonably expect a queue they are looking at
 * to be current. The counts endpoint is the cheap question — "did the number
 * move?" — so a quiet inbox costs one small request per tick, and a queue that
 * grew is only refetched when it actually did. This mirrors the page-content
 * poll, deliberately: one idea, one place it is explained.
 */
@Injectable({ providedIn: 'root' })
export class SubmissionCountStore implements OnDestroy {
  private readonly staff = inject(StaffSubmissionsService);

  private readonly state = signal<SubmissionCounts | null>(null);

  /** Fires when a poll reports a different set of numbers. */
  private readonly changes$ = new Subject<SubmissionCounts>();

  /** How many screens are watching. Polling stops when this reaches zero. */
  private watchers = 0;
  /** A request is in flight; skip the tick rather than stacking requests. */
  private busy = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  /** The known counts, or null before the first successful response. */
  readonly counts = this.state.asReadonly();

  /** True once a request has been made, for the sidebar's loading state. */
  readonly loaded = computed(() => this.state() !== null);

  ngOnDestroy(): void {
    this.stop();
  }

  /**
   * Watch for new submissions, and receive the counts whenever they change.
   *
   * Refcounted and shared: the sidebar and the list on the same screen both
   * subscribe, and one interval serves both. Releasing the subscription stops
   * the polling, so leaving the admin costs nothing.
   *
   * Only genuine changes are emitted. A poll that returns the same numbers the
   * store already holds says nothing, and a screen that refetched a list on
   * every tick would re-render constantly and could fight a staff member
   * reading one.
   */
  watch(): Observable<SubmissionCounts> {
    this.watchers += 1;
    if (this.watchers === 1) {
      this.fetch(false);
      this.start();
    }

    return this.changes$.pipe(
      finalize(() => {
        this.watchers = Math.max(0, this.watchers - 1);
        if (this.watchers === 0) {
          this.stop();
        }
      }),
    );
  }

  /**
   * Adopt the total a list endpoint reported.
   *
   * The list responses carry a whole-table `count`, so loading a list is a free,
   * more accurate refresh of that one badge than the counts endpoint would be.
   */
  adoptFromList(key: CountKey, count: number): void {
    this.state.update(current => ({ ...EMPTY, ...current, [key]: count }));
  }

  // -------------------------------------------------------------------------

  private start(): void {
    this.stop();
    this.timer = setInterval(() => this.fetch(true), SUBMISSION_POLL_MS);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  private stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  /**
   * Coming back to a tab should not wait out a full interval: submissions that
   * arrived while it sat in the background are the ones being waited for.
   */
  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible' && this.watchers > 0) {
      this.fetch(true);
    }
  };

  /**
   * Ask for the counts and tell the watchers if they moved.
   *
   * `quiet` is a poll: it must not blank the sidebar, and a failure must be
   * retried on the next tick rather than remembered. A one-shot refresh also
   * releases its request guard on failure, so a lapsed session is not cached as
   * "no submissions".
   */
  private fetch(quiet: boolean): void {
    if (this.busy) {
      return;
    }
    // A hidden tab is not watching; the next visible change event catches up.
    if (quiet && document.visibilityState !== 'visible') {
      return;
    }

    this.busy = true;
    this.staff.counts().subscribe({
      next: (counts) => {
        this.busy = false;
        const current = this.state();
        this.state.set(counts);
        if (current !== null && !sameCounts(current, counts)) {
          this.changes$.next(counts);
        }
      },
      error: () => {
        this.busy = false;
        // A 403 means the session lapsed and the interceptor is already sending
        // the user to /login. Nothing is cached, so the next tick tries again
        // rather than leaving the rail stuck on a failure it cannot clear.
      },
    });
  }
}
