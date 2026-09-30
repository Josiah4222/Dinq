import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { SUBMISSION_POLL_MS } from '../core/submission-count.store';
import { SubmissionCounts } from '../core/staff-submissions.service';
import { StaffDashboardComponent } from './staff-dashboard.component';

const COUNTS_URL = '/api/staff/submissions/counts/';
const CONTACTS_URL = '/api/staff/submissions/contact/?source=contact';

function counts(overrides: Partial<SubmissionCounts> = {}): SubmissionCounts {
  return {
    contacts: 0,
    quickInquiries: 0,
    contactsTotal: 0,
    propertyLeads: 0,
    newsletter: 0,
    newsletterActive: 0,
    ...overrides,
  };
}

describe('StaffDashboardComponent', () => {
  let fixture: ComponentFixture<StaffDashboardComponent>;
  let httpMock: HttpTestingController;
  /** The tab's visibility, which decides whether the screen polls at all. */
  let visibility: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffDashboardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            user: () => ({ username: 'staffer', isSuperuser: false }),
            displayName: () => 'Staffer',
          },
        },
        { provide: ActivatedRoute, useValue: { snapshot: { data: { tab: 'contacts' } } } },
      ],
    })
      // The behaviour under test is which requests the screen makes, not how the
      // rows are marked up, so the template and the rail are left out of it.
      .overrideComponent(StaffDashboardComponent, { set: { template: '', imports: [] } })
      .compileComponents();

    // Headless Chrome's visibility depends on how the runner was launched, and
    // a hidden screen deliberately does not poll, so it is pinned per test.
    visibility = spyOnProperty(document, 'visibilityState');
    visibility.and.returnValue('visible');

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(StaffDashboardComponent);
  });

  afterEach(() => {
    httpMock.verify();
  });

  /**
   * Run a test on the fake clock, tearing the screen down inside the same zone.
   *
   * The screen polls on a `setInterval`, and only unsubscribing stops it. A
   * destroy issued from `afterEach` runs outside the zone the timer was created
   * in, so it cannot cancel it, and the next test would inherit a poll firing
   * into its own backend. Tearing down in a `finally` keeps every screen's timer
   * inside its own test.
   */
  function onScreen(body: () => void): void {
    fakeAsync(() => {
      try {
        body();
      } finally {
        fixture.destroy();
      }
    })();
  }

  /** Answer the counts request and the list request the first load makes. */
  function settle(initial: SubmissionCounts, listCount = 0): void {
    httpMock.expectOne(COUNTS_URL).flush(initial);
    httpMock.expectOne(CONTACTS_URL).flush({ count: listCount, results: [] });
  }

  it('loads the queue the route selected', () => {
    onScreen(() => {
      fixture.detectChanges();
      settle(counts());

      tick(SUBMISSION_POLL_MS);
      httpMock.expectOne(COUNTS_URL).flush(counts());
    });
  });

  it('refetches the queue on screen when a submission arrives', () => {
    onScreen(() => {
      fixture.detectChanges();
      settle(counts());

      // A submission lands: the count moves, so the list is asked for again
      // and the new row appears without anybody reloading.
      tick(SUBMISSION_POLL_MS);
      httpMock.expectOne(COUNTS_URL).flush(counts({ contacts: 1, contactsTotal: 1 }));
      httpMock.expectOne(CONTACTS_URL).flush({ count: 1, results: [] });

      // A quiet queue settles back down to the cheap poll.
      tick(SUBMISSION_POLL_MS);
      httpMock.expectOne(COUNTS_URL).flush(counts({ contacts: 1, contactsTotal: 1 }));
      httpMock.expectNone(CONTACTS_URL);
    });
  });

  it('ignores a change in a queue that is not on screen', () => {
    onScreen(() => {
      fixture.detectChanges();
      settle(counts());

      // A quick inquiry arrives while the consultation queue is being watched.
      tick(SUBMISSION_POLL_MS);
      httpMock.expectOne(COUNTS_URL).flush(counts({ quickInquiries: 1, contactsTotal: 1 }));

      // No list request, so the rows being read are left alone. The badge for
      // the other queue is already live through the shared counts.
      tick(SUBMISSION_POLL_MS);
      httpMock.expectOne(COUNTS_URL).flush(counts({ quickInquiries: 1, contactsTotal: 1 }));
      httpMock.expectNone(CONTACTS_URL);
    });
  });

  it('does not poll while the tab is hidden', () => {
    onScreen(() => {
      visibility.and.returnValue('hidden');
      fixture.detectChanges();
      // The first load is not a poll, so it is still answered.
      settle(counts());

      tick(SUBMISSION_POLL_MS * 4);
      httpMock.expectNone(COUNTS_URL);
    });
  });

  it('catches up as soon as the tab is shown again', () => {
    onScreen(() => {
      fixture.detectChanges();
      settle(counts());

      visibility.and.returnValue('hidden');
      tick(SUBMISSION_POLL_MS * 3);
      httpMock.expectNone(COUNTS_URL);

      // Coming back does not wait out an interval: whatever arrived while the
      // tab was away is fetched on the spot.
      visibility.and.returnValue('visible');
      document.dispatchEvent(new Event('visibilitychange'));

      httpMock.expectOne(COUNTS_URL).flush(counts({ contacts: 1, contactsTotal: 1 }));
      httpMock.expectOne(CONTACTS_URL).flush({ count: 1, results: [] });
    });
  });

  it('keeps the rows on screen during a refresh it did not ask for', () => {
    onScreen(() => {
      fixture.detectChanges();
      settle(counts());
      expect(fixture.componentInstance.loading()).toBe(false);

      tick(SUBMISSION_POLL_MS);
      httpMock.expectOne(COUNTS_URL).flush(counts({ contacts: 1, contactsTotal: 1 }));

      // Asked for, but the list is never blanked while it is fetched, so a
      // message being read is not replaced by a loading state.
      expect(fixture.componentInstance.loading()).toBe(false);
      httpMock.expectOne(CONTACTS_URL).flush({ count: 1, results: [] });
    });
  });

  it('refetches on demand through the Reload button', () => {
    onScreen(() => {
      fixture.detectChanges();
      settle(counts());

      fixture.componentInstance.reload();
      httpMock.expectOne(CONTACTS_URL).flush({ count: 0, results: [] });
      tick(SUBMISSION_POLL_MS);
      httpMock.expectOne(COUNTS_URL).flush(counts());
    });
  });

  it('stops polling once the screen is left', () => {
    onScreen(() => {
      fixture.detectChanges();
      settle(counts());

      fixture.destroy();
      tick(SUBMISSION_POLL_MS * 4);
      httpMock.expectNone(COUNTS_URL);
    });
  });

  it('does not stack requests when a tick lands during a fetch', () => {
    onScreen(() => {
      fixture.detectChanges();
      settle(counts());

      tick(SUBMISSION_POLL_MS);
      httpMock.expectOne(COUNTS_URL).flush(counts({ contacts: 1, contactsTotal: 1 }));
      httpMock.expectOne(CONTACTS_URL).flush({ count: 1, results: [] });

      // A tick landing while the list is still in flight must not start a
      // second fetch, or two responses would race and the older could land last.
      tick(SUBMISSION_POLL_MS);
      httpMock.expectOne(COUNTS_URL).flush(counts({ contacts: 2, contactsTotal: 2 }));
      httpMock.expectOne(CONTACTS_URL).flush({ count: 2, results: [] });
      tick(SUBMISSION_POLL_MS);
      httpMock.expectOne(COUNTS_URL).flush(counts({ contacts: 2, contactsTotal: 2 }));
    });
  });
});
