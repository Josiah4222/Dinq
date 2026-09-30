import { Component, AfterViewInit, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RevealDirective } from '../reveal.directive';
import { CmsPage } from '../core/cms-page';
import { overlayHero, overlaySections } from './standard-page-merge';
import { ImageSrcPipe } from '../core/image-src.pipe';
import { ScrollToDirective } from '../scroll-to.directive';

/**
 * Content model for the reusable Standard Content Page template (master doc
 * Section 5). Each routed page supplies this through route `data`; the
 * component only renders structure, so Why Ethiopia (Section 8) and
 * Representative Matters (Section 9) can swap in their own sections without
 * touching the template.
 */

export interface StandardPageLink {
  label: string;
  /** Router destination (e.g. ['/'] with a fragment to deep-link home). */
  route?: string[];
  /** Router fragment, e.g. 'kairos' for /#kairos. */
  fragment?: string;
  /** External absolute URL Ã¢â‚¬â€ mutually exclusive with route/fragment. */
  href?: string;
}

export interface StandardPageItem {
  /** Optional heading Ã¢â‚¬â€ used by `values` cards and future grouped matters. */
  title?: string;
  /** Plain body text Ã¢â‚¬â€ used by `cards` and `values`. Either `text` or the
   *  structured case-study fields (`situation`/`role`) should be supplied. */
  text?: string;
  /** Optional practice-area tag for `cards` (rendered as a chip when present). */
  tag?: string;
  /** Structured case-study: what the client faced (rendered as "Situation").
   *  When present, the card switches to the case-study layout. */
  situation?: string;
  /** Structured case-study: Dinq's role (rendered as "Dinq Role"). */
  role?: string;
}

export interface StandardPageSection {
  id?: string;
  eyebrow?: string;
  heading?: string;
  /** Background treatment: cream body (light), cream-light card band (tint), navy (dark). */
  tone?: 'light' | 'tint' | 'dark';
  /**
   * Content alignment:
   *  - 'left'  Ã¢â€ â€™ text left-aligned (default)
   *  - 'right' Ã¢â€ â€™ text right-aligned
   */
  align?: 'left' | 'right';
  /**
   * Layout variant:
   *  - prose     Ã¢â€ â€™ eyebrow + heading + stacked paragraphs (optionally a link)
   *  - statement Ã¢â€ â€™ centered editorial block (vision/mission/purpose)
   *  - values    Ã¢â€ â€™ eyebrow + heading + item grid (core values)
   *  - cards     Ã¢â€ â€™ eyebrow + heading + numbered card rows (representative matters)
   *  - quote     Ã¢â€ â€™ centered pull quote (brand promise)
   */
  kind: 'prose' | 'statement' | 'values' | 'cards' | 'quote';
  paragraphs?: string[];
  /** Used by `quote` (single line) and `statement` (leading emphasis). */
  text?: string;
  /** Optional Amharic script accent for `statement` blocks. */
  amharic?: string;
  items?: StandardPageItem[];
  link?: StandardPageLink;
  /**
   * Marks a section as draft copy pending final editorial content Ã¢â‚¬â€ renders a
   * visible badge so placeholders can be swapped without a template change.
   */
  pending?: boolean;
}

export interface StandardPageHero {
  eyebrow?: string;
  title: string;
  lead?: string;
  /** Optional hero image Ã¢â‚¬â€ when provided, renders the image-based hero band. */
  image?: string;
}

export interface StandardPageNavItem {
  id: string;
  label: string;
}

/**
 * Standard Content Page Ã¢â‚¬â€ hero band + stacked content sections, driven
 * entirely by route data.
 *
 * Two layout modes (route `data.layout`):
 *  - default Ã¢â€ â€™ hero + stacked sections (used by /about)
 *  - anchors Ã¢â€ â€™ hero + sticky in-page anchor nav + long-form sections with
 *              scroll-spy highlighting (used by /why-ethiopia). Anchor-based
 *              routing means `/why-ethiopia#tax-corporate` deep-links work
 *              and stay stable as sections expand into standalone articles.
 *
 * On the anchors layout the nav links carry `appScrollTo` as well as a real
 * `href`. The router runs with `anchorScrolling: 'enabled'`, which claims a
 * plain fragment click and aligns the target to the document top - putting the
 * section heading underneath the navbar and the sticky nav bar. The directive
 * takes the click instead and uses `scrollIntoView`, which honours the
 * `scroll-margin-top` that clears both bars. The `href` stays for the no-JS
 * case and so a copied link is still a working deep link.
 */
@Component({
  selector: 'app-standard-page',
  imports: [RouterLink, RevealDirective, ImageSrcPipe, ScrollToDirective],
  templateUrl: './standard-page.component.html',
  styleUrl: './standard-page.component.scss',
})
export class StandardPageComponent extends CmsPage implements OnInit, AfterViewInit {
  private readonly route = inject(ActivatedRoute);

  /** The page's slug, taken from the route path, so the CMS page is findable. */
  private readonly slug = this.route.snapshot.routeConfig?.path ?? '';

  private readonly baseHero = (this.route.snapshot.data['hero'] ?? { title: '' }) as StandardPageHero;
  private readonly baseSections = (this.route.snapshot.data['sections'] ?? []) as StandardPageSection[];
  private readonly baseNav = this.route.snapshot.data['nav'] as StandardPageNavItem[] | undefined;

  readonly anchorLayout = this.route.snapshot.data['layout'] === 'anchors';

  /** Hero copy, from the route unless the CMS has an override. */
  readonly hero = computed(() => overlayHero(this.baseHero, this.values()));

  /** Sections, each with its CMS overrides. */
  readonly sections = computed(() => overlaySections(this.baseSections, this.values()));

  /**
   * Anchor-nav entries: explicit `data.nav` wins, else derived from the section
   * headings. Derived from the overlaid sections so a retitled heading is
   * reflected in the nav, but keyed on the section id, which is structural.
   */
  readonly navItems = computed<StandardPageNavItem[]>(() => {
    const configured = this.baseNav;
    if (configured?.length) {
      return configured;
    }
    return this.sections()
      .filter(section => section.id && section.heading)
      .map(section => ({ id: section.id as string, label: section.heading as string }));
  });

  /** Id of the section currently under the sticky nav (scroll-spy). */
  readonly activeSection = signal('');

  /** Offset from the viewport top used to decide which section is active. */
  private readonly spyOffset = 100;
  private scrollCleanup: (() => void) | undefined;

  ngOnInit(): void {
    if (this.slug) {
      this.bind(this.slug);
    }
  }

  ngAfterViewInit(): void {
    if (this.anchorLayout && typeof window !== 'undefined') {
      this.onSpyScroll();
      this.scrollCleanup = this.watchScroll();
    }
  }

  override ngOnDestroy(): void {
    // The base class releases the content subscription; the scroll listener is
    // this component's own.
    this.scrollCleanup?.();
    super.ngOnDestroy();
  }

  /** Passive scroll handler + rAF throttle for cheap scroll-spy updates. */
  private watchScroll(): () => void {
    let ticking = false;
    const onScroll = () => {
      if (ticking) {
        return;
      }
      ticking = true;
      requestAnimationFrame(() => {
        this.onSpyScroll();
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }

  /** Marks the section whose top has passed the sticky nav as active. */
  private onSpyScroll(): void {
    const navItems = this.navItems();
    const bottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;

    let current = '';
    if (!bottom) {
      for (const item of navItems) {
        const el = document.getElementById(item.id);
        if (!el) {
          continue;
        }
        if (el.getBoundingClientRect().top <= this.spyOffset) {
          current = item.id;
        }
      }
    }

    if (bottom && navItems.length) {
      current = navItems[navItems.length - 1].id;
    }

    this.activeSection.set(current);
  }
}
