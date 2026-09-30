import { Component, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { BrandLogoComponent } from '../brand-logo/brand-logo.component';
import { ScrollToDirective } from '../scroll-to.directive';

export interface NavChild {
  id: string;
  label: string;
  /** Route for child links that navigate to a page. When omitted the item
   *  renders as a static (non-clickable) label. */
  route?: string;
  /**
   * Fragment for child links that anchor-scroll within a route.
   * Used together with `route` so routerLink + fragment works correctly.
   */
  fragment?: string;
  /**
   * Optional heading for the group this child starts. A heading is rendered
   * above the first child of each run of children sharing the same `group`.
   * Used by the Industries menu to keep Core Industries and Additional
   * Sectors visually distinct.
   */
  group?: string;
}

export interface NavLink {
  id: string;
  label: string;
  /** Route for top-level routed links. */
  route?: string;
  /** Same-page section id for anchor-scroll top-level links. */
  anchor?: string;
  /** When present, renders a dropdown instead of a plain link. */
  children?: NavChild[];
}

/**
 * A run of sibling `NavChild` items that share a `group` label. A link with no
 * grouping yields a single group whose `label` is undefined, so every dropdown
 * renders as one or more columns without special-casing ungrouped menus.
 */
export interface NavChildGroup {
  label?: string;
  items: NavChild[];
}

/**
 * Site-wide primary navigation.
 *
 * Supports one level of dropdown menus on desktop (hover + focus-within).
 * On mobile/tablet the drawer expands each dropdown inline.
 * The About item is the only top-level entry with children; all others are
 * plain routed or anchor-scroll links.
 */
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, BrandLogoComponent, ScrollToDirective],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  /** Routes whose hero band is light (cream) rather than navy. */
  private readonly LIGHT_HERO_PREFIXES = ['/solutions', '/industries', '/insights'];
  private readonly LIGHT_HERO_PATHS = ['/contact'];

  readonly links: NavLink[] = [
    { id: 'home', label: 'Home', route: '/' },
    {
      id: 'about',
      label: 'About',
      route: '/about',
      children: [
        { id: 'about-who',      label: 'Who We Are',                      route: '/about/who-we-are' },
        { id: 'about-lead',     label: 'Leadership',                      route: '/about/leadership' },
        { id: 'about-approach', label: 'Our Approach',                    route: '/about/our-approach' },
        { id: 'about-alliance', label: 'Strategic Alliance with Kairos Law', route: '/about/kairos-law-alliance' },
      ],
    },
    { id: 'solutions',    label: 'Solutions',    route: '/solutions',    children: [
      { id: 'sol-intl',     label: 'International Business & Investment Advisory', route: '/solutions/international-business-investment-advisory' },
      { id: 'sol-diaspora', label: 'Diaspora Advisory',                             route: '/solutions/diaspora-advisory' },
      { id: 'sol-property', label: 'Property & Asset Management',                   route: '/solutions/property-asset-management' },
      { id: 'sol-govt',     label: 'Government & Institutional Advisory',           route: '/solutions/government-institutional-advisory' },
      { id: 'sol-workforce',label: 'Workforce & Organizational Advisory',           route: '/solutions/workforce-organizational-advisory' },
    ] },
    /* Menu-only trigger: there is no /industries index page, so the top-level
       item carries no `route` and only opens the dropdown. `isDropdownActive`
       still highlights it from the child routes. */
    { id: 'industries',   label: 'Industries',   children: [
      { id: 'ind-realestate',   label: 'Real Estate',        route: '/industries/real-estate',           group: 'Core Industries' },
      { id: 'ind-manufacturing',label: 'Manufacturing',      route: '/industries/manufacturing',        group: 'Core Industries' },
      { id: 'ind-mining',       label: 'Mining',             route: '/industries/mining',               group: 'Core Industries' },
      { id: 'ind-infrastructure', label: 'Infrastructure',   route: '/industries/infrastructure',       group: 'Additional Sectors' },
      { id: 'ind-energy',       label: 'Energy',            route: '/industries/energy',                group: 'Additional Sectors' },
      { id: 'ind-agribusiness', label: 'Agribusiness',      route: '/industries/agribusiness',          group: 'Additional Sectors' },
      { id: 'ind-technology',   label: 'Technology & Digital Business', route: '/industries/technology-digital-business', group: 'Additional Sectors' },
      { id: 'ind-healthcare',   label: 'Healthcare',        route: '/industries/healthcare',            group: 'Additional Sectors' },
      { id: 'ind-hospitality',  label: 'Hospitality & Tourism', route: '/industries/hospitality-tourism',  group: 'Additional Sectors' },
      { id: 'ind-financial',    label: 'Financial Services', route: '/industries/financial-services',    group: 'Additional Sectors' },
    ] },
    { id: 'why-ethiopia', label: 'Why Ethiopia', route: '/why-ethiopia' },
    { id: 'insights',     label: 'Insights',     route: '/insights' },
    { id: 'quick-inquiry', label: 'Quick Inquiry', route: '/quick-inquiry' },
    { id: 'contact',      label: 'Contact',      route: '/contact' },
  ];

  readonly scrolled   = signal(false);
  readonly menuOpen   = signal(false);
  readonly activeId   = signal('');
  readonly onLightHero = signal(false);

  /** Which dropdown is expanded in the mobile drawer (by link id). */
  readonly drawerExpanded = signal<string | null>(null);

  /**
   * Id of a desktop dropdown that was just clicked into. The desktop panels
   * are pure CSS (`:hover` / `:focus-within`), so a clicked link keeps the
   * panel open under the pointer and under focus. This flag force-closes that
   * one panel; it is cleared as soon as the pointer or focus re-enters.
   */
  readonly dismissedDropdown = signal<string | null>(null);

  private readonly router = inject(Router);
  private readonly anchorIds = this.links
    .map((link) => link.anchor)
    .filter((anchor): anchor is string => Boolean(anchor));
  private observer?: IntersectionObserver;

  constructor() {
    this.buildColumnGroups();
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.syncHeroTone();
        // Close drawer on navigation
        if (this.menuOpen()) {
          this.menuOpen.set(false);
          document.body.style.overflow = '';
        }
      });
    this.syncHeroTone();
  }

  ngAfterViewInit(): void {
    this.setupActiveObserver();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private syncHeroTone(): void {
    const path = this.router.url.split(/[?#]/)[0];
    this.onLightHero.set(
      this.LIGHT_HERO_PREFIXES.some((prefix) => path.startsWith(prefix))
      || this.LIGHT_HERO_PATHS.includes(path),
    );
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    this.scrolled.set(window.scrollY > 32);
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
    document.body.style.overflow = this.menuOpen() ? 'hidden' : '';
    if (!this.menuOpen()) {
      this.drawerExpanded.set(null);
    }
  }

  selectLink(): void {
    if (this.menuOpen()) {
      this.menuOpen.set(false);
      this.drawerExpanded.set(null);
      document.body.style.overflow = '';
    }
  }

  /** Routed-link click: close the drawer; scroll home to top when already there. */
  onRouteClick(link: NavLink | NavChild): void {
    this.selectLink();
    // Fold the desktop panel away when one of its items is chosen.
    const parentId = this.parentIdFor(link);
    if (parentId) {
      this.dismissedDropdown.set(parentId);
    }
    if ('id' in link && link.id === 'home' && this.router.url === '/') {
      const smooth = typeof window.matchMedia === 'function'
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
    }
  }

  /** Clears the click-dismissal so the panel reopens on the next hover/focus. */
  clearDismissedDropdown(): void {
    this.dismissedDropdown.set(null);
  }

  /** The id of the top-level dropdown that owns this link, when it is a child. */
  private parentIdFor(link: NavLink | NavChild): string | null {
    if (!('id' in link)) return null;
    for (const parent of this.links) {
      if (parent.children?.some((child) => child.id === link.id)) {
        return parent.id;
      }
    }
    return null;
  }

  /** Toggle a dropdown section in the mobile drawer. */
  toggleDrawerSection(id: string): void {
    this.drawerExpanded.update((current) => (current === id ? null : id));
  }

  /** True when any route under a dropdown link (its own route or a child's
   *  route) is active — used to highlight the dropdown trigger. */
  isDropdownActive(link: NavLink): boolean {
    if (link.route && this.router.url.startsWith(link.route)) {
      return true;
    }
    return link.children?.some((child) => child.route && this.router.url.startsWith(child.route)) ?? false;
  }

  /**
   * True when the child at `index` opens a new group — i.e. it declares a
   * `group` that differs from the preceding sibling's. Children with no group
   * (About, Solutions) never produce a heading.
   */
  isGroupStart(children: NavChild[] | undefined, index: number): boolean {
    if (!children) return false;
    const group = children[index]?.group;
    if (!group) return false;
    return children[index - 1]?.group !== group;
  }

  /**
   * Column layout for a dropdown: sibling children are split into runs by
   * their `group` label, so Industries renders as "Core Industries" (left) and
   * "Additional Sectors" (right). Menus without grouping return a single
   * unlabelled column, which renders exactly as before.
   *
   * Precomputed once so `@for` gets a stable array reference each cycle.
   */
  private readonly columnGroups = new Map<string, NavChildGroup[]>();

  groupsFor(link: NavLink): NavChildGroup[] {
    return this.columnGroups.get(link.id) ?? [];
  }

  private buildColumnGroups(): void {
    for (const link of this.links) {
      if (!link.children?.length) continue;
      const groups: NavChildGroup[] = [];
      for (const child of link.children) {
        const current = groups[groups.length - 1];
        if (current && current.label === child.group) {
          current.items.push(child);
        } else {
          groups.push({ label: child.group, items: [child] });
        }
      }
      this.columnGroups.set(link.id, groups);
    }
  }

  private setupActiveObserver(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          this.activeId.set(entry.target.id);
        }
      }
    }, { rootMargin: '-38% 0px -55% 0px', threshold: 0 });

    for (const id of this.anchorIds) {
      const el = document.getElementById(id);
      if (el) this.observer.observe(el);
    }
  }
}
