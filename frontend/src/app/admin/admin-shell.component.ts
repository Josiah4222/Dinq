import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { CountKey, SubmissionCountStore } from '../core/submission-count.store';

/** One submission destination in the rail. */
interface SubmissionItem {
  id: string;
  label: string;
  route: string;
  icon: 'envelope' | 'bolt' | 'building' | 'mail';
  /** Which count the badge shows. */
  countKey: CountKey;
}

/**
 * The submission queues, in the order they are triaged. They are separate
 * destinations rather than tabs inside one screen: a newsletter signup is not a
 * lead, so they are opened and worked separately, and giving each its own route
 * means the one being looked at can be linked to, bookmarked, and come back to
 * on a reload.
 *
 * Quick inquiries and full consultation requests share one table on the server
 * but are listed apart here. They arrive with very different amounts of detail
 * — a quick inquiry is a name and a phone number, a consultation is a brief to
 * prepare for — so they are worked differently and reading them interleaved by
 * date would hide that. The count badges come from the matching `source`
 * filters, so each number belongs to the list beside it.
 */
const SUBMISSION_ITEMS: SubmissionItem[] = [
  { id: 'contacts', label: 'Contact & Consultation', route: '/admin/contact', icon: 'envelope', countKey: 'contacts' },
  { id: 'quickInquiries', label: 'Quick Inquiries', route: '/admin/quick-inquiries', icon: 'bolt', countKey: 'quickInquiries' },
  { id: 'leads', label: 'Property Leads', route: '/admin/property-leads', icon: 'building', countKey: 'propertyLeads' },
  // The subscriber email list. Called "Subscribers" rather than "Newsletter" so
  // it cannot be confused with the Newsletters authoring screen under Content.
  { id: 'subscribers', label: 'Subscribers', route: '/admin/newsletter', icon: 'mail', countKey: 'newsletter' },
];

/**
 * The frame every staff screen sits in: the dark navigation rail, the account
 * block, and the content column.
 *
 * The rail holds the destinations. The three submission types are listed here
 * rather than as tabs inside the inbox, so the counts are visible from any staff
 * screen -- including page content, where knowing there are three new enquiries
 * waiting is the reason to go back.
 *
 * Sign-out and the signed-in identity live here because they apply everywhere.
 */
@Component({
  selector: 'app-admin-shell',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
})
export class AdminShellComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly countStore = inject(SubmissionCountStore);

  readonly user = this.auth.user;
  // Computed rather than copied into a signal in the constructor: renaming
  // yourself on /admin/account updates this chip without leaving the screen.
  readonly displayName = computed(() => this.auth.displayName());
  readonly signingOut = signal(false);

  readonly submissionItems = computed(() => SUBMISSION_ITEMS);
  readonly navOpen = signal(false);

  /** The count poll, released on destroy so leaving the admin stops it. */
  private watch?: Subscription;

  /** Up to two initials for the rail's avatar chip. */
  readonly initials = computed(() => {
    const name = this.auth.displayName().trim();
    if (!name) {
      return 'ST';
    }
    const parts = name.split(/\s+/).filter(Boolean);
    const letters = parts.slice(0, 2).map(part => part[0]?.toUpperCase() ?? '');
    return letters.join('') || name.slice(0, 2).toUpperCase();
  });

  private escapeListener = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.closeNav();
    }
  };

  ngOnInit(): void {
    this.watch = this.countStore.watch().subscribe();
    this.watch.add(this.router.events.subscribe(() => this.closeNav()));
    document.addEventListener('keydown', this.escapeListener);
  }

  ngOnDestroy(): void {
    this.watch?.unsubscribe();
    document.removeEventListener('keydown', this.escapeListener);
  }

  toggleNav(): void {
    this.navOpen.update((v) => !v);
  }

  closeNav(): void {
    this.navOpen.set(false);
  }

  /**
   * The count to badge a rail item with, or null if it is not known yet.
   *
   * Null means "render no badge", which is the honest state before the request
   * lands. A 0 badge would read as an answer, and "no submissions" is a claim
   * the screen has not earned at that point.
   */
  countFor(key: CountKey): number | null {
    const counts = this.countStore.counts();
    return counts === null ? null : counts[key];
  }

  async signOut(): Promise<void> {
    if (this.signingOut()) {
      return;
    }
    this.signingOut.set(true);
    // logout() is an Observable, so awaiting the object itself would resolve
    // without ever sending the request — firstValueFrom subscribes and turns
    // the response into the promise this method is waiting on. The service
    // clears local state on failure too, so the finally clause lands on the
    // sign-in screen either way instead of leaving the button stuck.
    try {
      await firstValueFrom(this.auth.logout());
    } finally {
      this.signingOut.set(false);
      this.router.navigate(['/login']);
    }
  }
}
