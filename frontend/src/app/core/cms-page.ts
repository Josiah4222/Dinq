import { Directive, OnDestroy, Signal, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { PageContentService, PageValues, PUBLIC_POLL_MS } from './page-content.service';

/**
 * Shared "this page's content" plumbing for components that render CMS pages.
 *
 * Subscribing is what starts polling and unsubscribing is what stops it, so
 * getting the release wrong leaks a timer for the life of the tab. Centralising
 * it here means a component only has to call `bind` -- the subclass gets
 * `ngOnDestroy` from this class, and a component that forgets to extend it is
 * the one place a leak could still creep in.
 *
 * Values stay null until the first response and on any failure, so a template
 * can treat null as "use the shipped copy" without a loading flag.
 */
@Directive()
export abstract class CmsPage implements OnDestroy {
  protected readonly content = inject(PageContentService);

  /** Stored values per watched slug. */
  private readonly store = signal<Record<string, PageValues | null>>({});

  /** The slug bound with `bind`, so `values` can be derived from the record. */
  private primary: string | null = null;

  private subs: Subscription[] = [];

  /** Values for the page bound with `bind`. */
  readonly values = computed(() => (this.primary === null ? null : this.store()[this.primary] ?? null));

  /**
   * Values for every page bound with `bindMany`, keyed by slug.
   *
   * An index page renders its children rather than keeping its own copy of
   * them, so it needs each child's values kept apart -- merging them would
   * collide, because two articles both have a `title`.
   */
  private readonly many = signal<Record<string, PageValues | null>>({});

  /** Watch one page. Safe to call again to switch pages. */
  protected bind(slug: string, intervalMs: number = PUBLIC_POLL_MS): void {
    this.bindMany([slug], slug, intervalMs);
  }

  /**
   * Watch several pages, exposed through `many`.
   *
   * `primary` is the slug whose values `values` should report, for a page that
   * has copy of its own *and* lists child pages. It is optional: an index that
   * has no copy of its own passes only the children.
   */
  protected bindMany(
    slugs: string[],
    primary?: string,
    intervalMs: number = PUBLIC_POLL_MS,
  ): void {
    this.release();
    this.primary = primary ?? null;

    const initial: Record<string, PageValues | null> = {};
    for (const slug of slugs) {
      initial[slug] = null;
    }
    this.store.set(initial);
    this.many.set(initial);

    for (const slug of slugs) {
      this.subs.push(
        this.content.watch(slug, { intervalMs }).subscribe(values => {
          const next = { ...this.store(), [slug]: values };
          this.store.set(next);
          this.many.set(next);
        }),
      );
    }
  }

  /** A read-only handle on the multi-page record, for use in a computed. */
  protected manyValues(): Signal<Record<string, PageValues | null>> {
    return this.many.asReadonly();
  }

  ngOnDestroy(): void {
    this.release();
  }

  private release(): void {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
    this.subs = [];
    this.store.set({});
    this.many.set({});
  }
}
