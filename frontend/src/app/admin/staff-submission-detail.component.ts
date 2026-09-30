import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AuthService } from '../core/auth.service';
import {
  ContactSource,
  StaffContactSubmission,
  StaffSubmissionsService,
  SubmissionStatus,
} from '../core/staff-submissions.service';
import { AdminShellComponent } from './admin-shell.component';

/**
 * One submission, in full, for the screen a staff member reaches from a list.
 *
 * The lists show a line per submission — a reference, a name, enough to
 * recognise it and decide which to open. Everything that does not fit on a line
 * is read here, on demand, rather than carried in all 200 rows of every list.
 *
 * The route carries the kind of submission as well as its id, because the two
 * forms share a table: `admin/quick-inquiries/12` means "the quick inquiry
 * numbered 12", not "contact row 12". That is passed to the server as `source`,
 * which treats a mismatch as not found, so a mistyped or hand-edited URL cannot
 * show one form's headings over the other's data.
 *
 * Separate from StaffDashboardComponent rather than a mode of it: this screen
 * has no list, no counts, and nothing to reload, so sharing the component would
 * mean every list concern had to be conditionally switched off around it.
 */
@Component({
  selector: 'app-staff-submission-detail',
  imports: [DatePipe, RouterLink, AdminShellComponent],
  templateUrl: './staff-submission-detail.component.html',
  styleUrl: './staff-submission-detail.component.scss',
})
export class StaffSubmissionDetailComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly staff = inject(StaffSubmissionsService);
  private readonly route = inject(ActivatedRoute);

  readonly user = this.auth.user;
  readonly displayName = signal('');

  /** The row, or null while loading or after a miss. */
  readonly submission = signal<StaffContactSubmission | null>(null);
  readonly loading = signal(true);
  /** Set for a row that is not there; shown instead of the record. */
  readonly notFound = signal(false);

  /** Which form this screen is showing, taken from the route. */
  readonly source = signal<ContactSource>('contact');

  /** Where "back" goes and what it says, per form. */
  private readonly QUEUE = {
    contact: { label: 'Contact & Consultation', route: '/admin/contact' },
    quick_inquiry: { label: 'Quick Inquiries', route: '/admin/quick-inquiries' },
  } as const;

  readonly queue = computed(() => this.QUEUE[this.source()]);

  /**
   * The heading: who the submission is from, once it is known.
   *
   * Not the `CON-000005` reference. That is an internal row id, useful in a URL
   * or a log, and it is what the database is keyed by — but it carries no
   * meaning for a staff member reading a message, and it reads as noise above
   * the name of the person who actually wrote it.
   */
  readonly title = computed(() => this.submission()?.fullName || this.queue().label);

  /** The ticked topics, joined for a single line. Empty is stated, not shown blank. */
  readonly topics = computed(() => this.submission()?.areasOfInterest ?? []);

  constructor() {
    this.displayName.set(this.auth.displayName());
  }

  ngOnInit(): void {
    // Read the route the same way the list screens read their tab, so the two
    // agree on which queue is which.
    const source = this.route.snapshot.data['source'] as ContactSource | undefined;
    this.source.set(source === 'quick_inquiry' ? 'quick_inquiry' : 'contact');

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id < 1) {
      this.loading.set(false);
      this.notFound.set(true);
      return;
    }

    this.staff
      .getContact(id, this.source())
      .pipe(
        catchError((err: HttpErrorResponse) => {
          // 404 is the server agreeing that this queue does not hold that row.
          // A 403 is a lapsed session, which the interceptor is already sending
          // to /login, so it must not be reported as a missing submission.
          if (err.status !== 403) {
            this.notFound.set(true);
          }
          return of(null);
        }),
      )
      .subscribe((row) => {
        this.loading.set(false);
        this.submission.set(row);
        if (row) {
          this.markSeen(id);
        }
      });
  }

  /**
   * Record that this submission has been opened, so it stops being flagged as
   * new to the rest of the team.
   *
   * The pill for a `new` row is hidden in this screen regardless, because you
   * are looking at it — otherwise it would flash on the way in and vanish a
   * moment later. This call is what makes the flag stay gone for everyone else
   * and on the next visit.
   *
   * Failure is ignored deliberately. The screen has already shown the record, and
   * a row that stays flagged as new is a much smaller problem than an error
   * message over a message somebody came to read.
   */
  private markSeen(id: number): void {
    this.staff
      .markContactSeen(id, this.source())
      .pipe(catchError(() => of(null)))
      .subscribe((row) => {
        if (row) {
          this.submission.set(row);
        }
      });
  }

  statusLabel(status: SubmissionStatus): string {
    return status.replace('_', ' ');
  }

  /** True for a field the submitter never filled in, so it can be left out. */
  has(value: string | null | undefined): boolean {
    return !!value && value.trim().length > 0;
  }
}
