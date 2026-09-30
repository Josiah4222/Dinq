import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, map, type Subscription } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { SubmissionCountStore } from '../core/submission-count.store';
import {
  StaffContactSubmission,
  StaffPropertyLead,
  StaffSubscriber,
  StaffSubmissionsService,
  SubmissionCounts,
  SubmissionStatus,
  isUnread,
} from '../core/staff-submissions.service';
import { AdminShellComponent } from './admin-shell.component';

/**
 * What each list endpoint returns, folded into one shape so the three bodies
 * share a single subscribe. `kind` says which signal to write into, and `count`
 * is the whole-table total the sidebar badge adopts.
 */
type InboxResult =
  | { kind: 'contacts'; rows: StaffContactSubmission[]; count: number }
  | { kind: 'quickInquiries'; rows: StaffContactSubmission[]; count: number }
  | { kind: 'leads'; rows: StaffPropertyLead[]; count: number }
  | { kind: 'subscribers'; rows: StaffSubscriber[]; count: number; activeCount: number };

/**
 * Which submission type a screen shows. The id matches the sidebar item and the
 * route's `data.tab`, so the rail, the URL, and the content pane cannot drift
 * apart.
 */
type StaffTab = 'contacts' | 'quickInquiries' | 'leads' | 'subscribers';

const TAB_LABELS: Record<StaffTab, string> = {
  contacts: 'Contact & Consultation',
  quickInquiries: 'Quick Inquiries',
  leads: 'Property Leads',
  subscribers: 'Newsletter',
};

/** Empty wording for a queue with nothing in it, per tab. */
const EMPTY_MESSAGES: Record<StaffTab, string> = {
  contacts: 'No contact or consultation requests yet.',
  quickInquiries: 'No quick inquiries yet.',
  leads: 'No property leads yet.',
  subscribers: 'No newsletter subscribers yet.',
};

/**
 * Which sidebar item's count feeds each list's badge, and which list response
 * carries it. Paired with the request builder below so adding a submission type
 * means touching this map and the one case block, not four unrelated places.
 */
const COUNT_KEYS = {
  contacts: 'contacts',
  quickInquiries: 'quickInquiries',
  leads: 'propertyLeads',
  subscribers: 'newsletter',
} as const satisfies Record<StaffTab, keyof SubmissionCounts>;

/**
 * One staff inbox screen, rendered for whichever submission queue the route
 * selects.
 *
 * The queues are separate routes, so the sidebar can list them and the URL can
 * be shared or reloaded, and only the selected one is fetched. The sidebar
 * carries the other counts, fetched separately, so nobody has to click through
 * to learn there is something waiting.
 *
 * Every queue is a list of one line per submission, and a row opens the full
 * record in its own screen. A list is for deciding which submission to work;
 * reading a message needs the room and the labelled fields of the detail screen,
 * and not paying for that on all 200 rows of every queue.
 *
 * Read-only: status and notes are editable in the Django admin for now. The
 * models already carry them, so writing back is a small addition here.
 *
 * A queue stays current on its own. The count store polls, and when the number
 * for the queue on screen moves this refetches it, so a submission sent from the
 * public site appears without the staff member reloading or reaching for the
 * Reload button. Only the queue being looked at is refetched: the other three
 * are already represented by their sidebar badges, and fetching a 200-row list
 * nobody is reading to keep a badge honest would cost more than it is worth.
 */
@Component({
  selector: 'app-staff-dashboard',
  imports: [DatePipe, RouterLink, AdminShellComponent],
  templateUrl: './staff-dashboard.component.html',
  styleUrl: './staff-dashboard.component.scss',
})
export class StaffDashboardComponent implements OnInit, OnDestroy {
  /** Exposed for the template: a row is flagged only while it is unseen. */
  readonly isUnread = isUnread;

  private readonly auth = inject(AuthService);
  private readonly staff = inject(StaffSubmissionsService);
  private readonly countStore = inject(SubmissionCountStore);
  private readonly route = inject(ActivatedRoute);

  readonly user = this.auth.user;
  readonly displayName = signal('');

  readonly activeTab = signal<StaffTab>('contacts');

  readonly contacts = signal<StaffContactSubmission[]>([]);
  readonly quickInquiries = signal<StaffContactSubmission[]>([]);
  readonly leads = signal<StaffPropertyLead[]>([]);
  readonly subscribers = signal<StaffSubscriber[]>([]);
  readonly activeSubscriberCount = signal(0);

  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  /** Which list is already in memory, so re-entering one does not re-request. */
  private loaded = new Set<StaffTab>();

  /** Queues with a request in flight, so a tick cannot stack a second one. */
  private inFlight = new Set<StaffTab>();

  /** The count each queue was last rendered at, to spot one that has moved. */
  private renderedCount = new Map<StaffTab, number>();

  /** The count poll, released on destroy so leaving the screen stops it. */
  private watch?: Subscription;

  /** Django caps each list at 200 most recent rows. */
  readonly rowLimitNote = 'Showing the 200 most recent entries.';

  readonly contactCount = computed(() => this.contacts().length);
  readonly quickInquiryCount = computed(() => this.quickInquiries().length);
  readonly leadCount = computed(() => this.leads().length);
  readonly subscriberCount = computed(() => this.subscribers().length);

  /** Heading for the content pane, matching the selected sidebar item. */
  readonly activeLabel = computed(() => TAB_LABELS[this.activeTab()]);

  /** What an empty queue says, so no tab shows another tab's wording. */
  readonly emptyMessage = computed(() => EMPTY_MESSAGES[this.activeTab()]);

  constructor() {
    // The guard already resolved the session; mirror it for display.
    this.displayName.set(this.auth.displayName());
  }

  ngOnInit(): void {
    const tab = this.route.snapshot.data['tab'] as StaffTab | undefined;
    if (tab) {
      this.activeTab.set(tab);
    }
    this.load(this.activeTab());
    this.watchSubmissions();
  }

  ngOnDestroy(): void {
    this.watch?.unsubscribe();
  }

  reload(): void {
    this.load(this.activeTab(), { force: true });
  }

  statusLabel(status: SubmissionStatus): string {
    return status.replace('_', ' ');
  }

  /**
   * True for a field the submitter filled in.
   *
   * The two forms share a table, so a row in either list is missing most of the
   * other's fields. Checking the value rather than testing the model keeps the
   * row from reserving space for a reason or an email that a quick inquiry has
   * no field for.
   */
  has(value: string | null | undefined): boolean {
    return !!value && value.trim().length > 0;
  }

  /**
   * Refetch the queue a screen shows.
   *
   * Three callers, three intents. A first visit loads once and may show a
   * loading state. The Reload button forces a refetch of a list already held.
   * The count poll refetches quietly, because blanking a list a staff member is
   * reading to tell them a message arrived would be a worse trade than a short
   * delay in showing it.
   */
  private load(tab: StaffTab, options: { force?: boolean; quiet?: boolean } = {}): void {
    const held = this.loaded.has(tab);

    // A second request for the same queue would race the first and could land
    // stale rows afterwards, so a tick during a request is dropped rather than
    // queued. The next tick catches whatever was missed.
    if (this.inFlight.has(tab)) {
      return;
    }
    if (held && !options.force) {
      return;
    }

    this.inFlight.add(tab);
    // Only the first load of a queue is worth announcing; a refetch of rows
    // already on screen must not flash an empty pane over them.
    if (!held || !options.quiet) {
      this.loading.set(true);
      this.loadError.set(null);
    }

    // The two contact tabs read the same endpoint with a different `source`, so
    // the queue a screen shows is decided in one place per tab rather than by
    // each tab's template reaching for whichever list it happens to hold.
    const request$: Observable<InboxResult> =
      tab === 'contacts'
        ? this.staff
            .listContacts('contact')
            .pipe(map((res) => ({ kind: 'contacts', rows: res.results, count: res.count })))
        : tab === 'quickInquiries'
          ? this.staff
              .listContacts('quick_inquiry')
              .pipe(map((res) => ({ kind: 'quickInquiries', rows: res.results, count: res.count })))
          : tab === 'leads'
            ? this.staff.listPropertyLeads().pipe(map((res) => ({ kind: 'leads', rows: res.results, count: res.count })))
            : this.staff
                .listSubscribers()
                .pipe(
                  map((res) => ({
                    kind: 'subscribers',
                    rows: res.results,
                    count: res.count,
                    activeCount: res.activeCount,
                  })),
                );

    request$.subscribe({
      next: (res) => {
        this.inFlight.delete(res.kind);
        this.loading.set(false);
        this.loaded.add(res.kind);
        this.renderedCount.set(res.kind, res.count);

        // The list's own whole-table total is fresher than the counts endpoint,
        // so hand it to the shared store and the sidebar badge updates with it.
        this.countStore.adoptFromList(COUNT_KEYS[res.kind], res.count);

        switch (res.kind) {
          case 'contacts':
            this.contacts.set(res.rows);
            break;
          case 'quickInquiries':
            this.quickInquiries.set(res.rows);
            break;
          case 'leads':
            this.leads.set(res.rows);
            break;
          case 'subscribers':
            this.subscribers.set(res.rows);
            this.activeSubscriberCount.set(res.activeCount);
            break;
        }
      },
      error: () => {
        this.inFlight.delete(tab);
        this.loading.set(false);
        // A 403 means the session lapsed; the interceptor is already sending
        // the user to /login, so this only needs to not look like empty data.
        // A failed background refresh keeps the rows already on screen, because
        // stale submissions are better than an error the staff member did not
        // cause and cannot clear.
        if (options.quiet) {
          return;
        }
        this.loadError.set('Could not load these submissions. Please try again.');
      },
    });
  }

  /**
   * Keep the queue on screen current, without being told to.
   *
   * The store only emits when a count actually moved, so this runs after real
   * news rather than on every tick. The count the screen is already showing is
   * remembered, so a change to a queue on another tab — or a badge for one this
   * screen is not looking at — does not cause a pointless refetch.
   */
  private watchSubmissions(): void {
    this.watch = this.countStore.watch().subscribe((counts: SubmissionCounts) => {
      const tab = this.activeTab();
      const latest = counts[COUNT_KEYS[tab]];
      if (this.renderedCount.get(tab) === latest) {
        return;
      }
      this.load(tab, { force: true, quiet: true });
    });
  }
}
