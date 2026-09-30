import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy, inject } from '@angular/core';
import { BehaviorSubject, Observable, finalize } from 'rxjs';

/** A list block's items are either plain strings (the approach points) or objects. */
export type ListItem = string | Record<string, string>;

export type PageValues = Record<string, string | ListItem[]>;

export interface PublicPageContent {
  slug: string;
  route: string;
  values: PageValues;
  version: number;
  updatedAt: string;
}

export interface PublicPageVersion {
  slug: string;
  version: number;
  updatedAt: string;
}

export interface WatchOptions {
  /**
   * How often to check for a change, in ms. Public pages use a relaxed default
   * because every visitor's tab pays for it; the editor asks for something
   * shorter because a staff member is watching for their own save to land.
   */
  intervalMs?: number;
}

/** How often a public page checks for an edit. */
export const PUBLIC_POLL_MS = 15_000;
/** How often the editor checks. Only staff screens pay this. */
export const EDITOR_POLL_MS = 5_000;

/** Channel used to tell other open tabs about a save without a round trip. */
const SYNC_CHANNEL = 'dinq-page-content';

/** Per-page state. One of these exists per slug for the life of the app. */
interface PageStore {
  slug: string;
  values$: BehaviorSubject<PageValues | null>;
  /** The change token we last reconciled against. */
  version: number;
  /** How many components are currently watching. Polling stops at zero. */
  watchers: number;
  /** A request is in flight; skip this tick rather than stacking requests. */
  busy: boolean;
  intervalMs: number;
  timer: ReturnType<typeof setInterval> | null;
}

/**
 * Editable copy for public pages, read anonymously and kept up to date.
 *
 * A page watches its own content: the values load once, and afterwards a cheap
 * version check decides whether anything actually changed. When it has, the full
 * set is refetched and every open view of that page re-renders — so a save in
 * /admin/pages reaches an already-open tab without a manual reload.
 *
 * Two mechanisms, because they cover different cases. A BroadcastChannel message
 * makes a save in one tab of the same browser show up in another immediately.
 * The version poll catches everything else: another browser, another device, a
 * second staff member editing, or a tab that was closed and reopened. Polling
 * stops while the tab is hidden, so a page left open in the background costs
 * nothing.
 *
 * Every request swallows its errors and leaves the last good values in place. A
 * page must still render if the API is unreachable, the database is down, or the
 * page has not had its copy migrated yet — components fall back to their own
 * hardcoded text for any key that is missing. Failing loudly here would let an
 * editor convenience take the public site down.
 */
@Injectable({ providedIn: 'root' })
export class PageContentService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly stores = new Map<string, PageStore>();

  /** Null where the browser has no BroadcastChannel; the poll still works. */
  private readonly channel: BroadcastChannel | null =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(SYNC_CHANNEL) : null;

  constructor() {
    this.channel?.addEventListener('message', (event: MessageEvent<{ slug?: string }>) => {
      const slug = event.data?.slug;
      if (slug) {
        // Another tab saved. Reconcile now instead of waiting for the next tick.
        this.reconcile(slug);
      }
    });
  }

  ngOnDestroy(): void {
    for (const store of this.stores.values()) {
      this.stop(store);
    }
    this.channel?.close();
  }

  /**
   * Watch one page's content. Unsubscribing stops the polling for it, so a
   * component should hold the subscription and release it on destroy.
   */
  watch(slug: string, options: WatchOptions = {}): Observable<PageValues | null> {
    const store = this.storeFor(slug, options.intervalMs ?? PUBLIC_POLL_MS);
    store.watchers += 1;

    if (store.watchers === 1) {
      this.loadValues(slug, store);
      this.start(store);
    }

    return store.values$.pipe(
      finalize(() => {
        store.watchers = Math.max(0, store.watchers - 1);
        if (store.watchers === 0) {
          this.stop(store);
        }
      }),
    );
  }

  /** Call after a successful save, so this browser's own views update at once. */
  announceSave(slug: string): void {
    this.channel?.postMessage({ slug });
    // Also reconcile directly: a save made in the editor should be reflected
    // without waiting for the round trip, and the editor's own page is the
    // one most likely to be watched from a second tab.
    this.reconcile(slug);
  }

  /** Check a page now rather than at the next tick. */
  refresh(slug: string): void {
    this.reconcile(slug);
  }

  /**
   * Read one key, falling back to the copy the component ships with.
   * Pass the fallback rather than reading a signal so callers stay declarative.
   */
  text(values: PageValues | null, key: string, fallback: string): string {
    const value = values?.[key];
    return typeof value === 'string' && value.length ? value : fallback;
  }

  /**
   * Read a list key, falling back when the stored value is missing or empty.
   * The length check matters: an editor who clears a list should get the
   * shipped copy back rather than an empty section, and can remove items
   * deliberately instead of by emptying the field.
   *
   * `T` is the caller's own row type. It is not constrained to `ListItem`,
   * because the app's data interfaces describe their records precisely and have
   * no index signature; the stored JSON is cast rather than rebuilt, so the
   * caller's type is the one that says what a row means.
   */
  list<T extends string | object>(values: PageValues | null, key: string, fallback: T[]): T[] {
    const value = values?.[key];
    if (!Array.isArray(value) || value.length === 0) {
      return fallback;
    }
    return value as T[];
  }

  // -------------------------------------------------------------------------

  private storeFor(slug: string, intervalMs: number): PageStore {
    let store = this.stores.get(slug);
    if (!store) {
      store = {
        slug,
        values$: new BehaviorSubject<PageValues | null>(null),
        version: 0,
        watchers: 0,
        busy: false,
        intervalMs,
        timer: null,
      };
      this.stores.set(slug, store);
    }
    // The shortest interval any watcher asked for wins, so opening the editor
    // on a page a public tab is already watching speeds up the shared store.
    store.intervalMs = Math.min(store.intervalMs, intervalMs);
    return store;
  }

  private start(store: PageStore): void {
    this.stop(store);
    store.timer = setInterval(() => this.reconcile(store.slug), store.intervalMs);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  private stop(store: PageStore): void {
    if (store.timer !== null) {
      clearInterval(store.timer);
      store.timer = null;
    }
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  /**
   * Coming back to a tab should not wait out a full interval — the page may have
   * changed several times while the tab sat in the background.
   */
  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState !== 'visible') {
      return;
    }
    for (const store of this.stores.values()) {
      if (store.watchers > 0) {
        this.reconcile(store.slug);
      }
    }
  };

  /** Ask for the change token, and refetch only if it moved. */
  private reconcile(slug: string): void {
    const store = this.stores.get(slug);
    if (!store || store.busy) {
      return;
    }
    // Nothing to reconcile against until the first load has landed a version.
    if (store.version === 0) {
      return;
    }
    // A hidden tab is not watching; the next visible change event will catch up.
    if (document.visibilityState !== 'visible') {
      return;
    }

    store.busy = true;
    this.http.get<PublicPageVersion>(`/api/content/pages/${slug}/version/`).subscribe({
      next: (res) => {
        store.busy = false;
        if (res.version !== store.version) {
          this.loadValues(slug, store);
        }
      },
      error: () => {
        // Leave the last good values in place and try again next tick.
        store.busy = false;
      },
    });
  }

  /** Pull the full block set and hand it to every watcher of this page. */
  private loadValues(slug: string, store: PageStore): void {
    if (store.busy) {
      return;
    }
    store.busy = true;

    this.http.get<PublicPageContent>(`/api/content/pages/${slug}/`).subscribe({
      next: (content) => {
        store.busy = false;
        store.version = content.version ?? 1;
        store.values$.next(content.values ?? {});
      },
      error: () => {
        store.busy = false;
        // A page that has never loaded stays null so components use their
        // fallback copy. One that has loaded keeps the values it has, because
        // stale copy beats a blank section.
        if (store.version === 0) {
          store.version = 1;
          store.values$.next({});
        }
      },
    });
  }
}
