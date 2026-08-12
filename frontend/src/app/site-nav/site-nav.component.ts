import { Component, HostListener, inject, signal } from '@angular/core';
import { BrandLogoComponent } from '../brand-logo/brand-logo.component';
import { ScrollToDirective } from '../scroll-to.directive';

interface NavLink {
  id: string;
  label: string;
}

/**
 * Fixed site navigation. Transparent over the hero, gains a navy surface after
 * scrolling. All links are same-page anchor scrolls (scrollIntoView) — no
 * routing, since subpages don't exist yet. The active section is tracked with
 * an IntersectionObserver.
 */
@Component({
  selector: 'app-site-nav',
  imports: [BrandLogoComponent, ScrollToDirective],
  templateUrl: './site-nav.component.html',
  styleUrl: './site-nav.component.scss',
})
export class SiteNavComponent {
  readonly links: NavLink[] = [
    { id: 'why', label: 'Why Dinq' },
    { id: 'how', label: 'How We Work' },
    { id: 'solutions', label: 'Solutions' },
    { id: 'industries', label: 'Industries' },
    { id: 'kairos', label: 'Kairos' },
    { id: 'contact', label: 'Contact' },
  ];

  readonly scrolled = signal(false);
  readonly menuOpen = signal(false);
  readonly activeId = signal('');

  private readonly sectionIds = [...this.links.map((l) => l.id), 'home'];
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    this.setupActiveObserver();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    this.scrolled.set(window.scrollY > 32);
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
    document.body.style.overflow = this.menuOpen() ? 'hidden' : '';
  }

  selectLink(): void {
    if (this.menuOpen()) {
      this.menuOpen.set(false);
      document.body.style.overflow = '';
    }
  }

  /** Highlights the section currently in view as the user scrolls. */
  private setupActiveObserver(): void {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }
    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const id = entry.target.id || 'home';
          this.activeId.set(id);
        }
      }
    }, {
      rootMargin: '-38% 0px -55% 0px',
      threshold: 0,
    });

    // Sections live in child components; resolve them at runtime.
    for (const id of this.sectionIds) {
      const el = document.getElementById(id);
      if (el) {
        this.observer.observe(el);
      }
    }
  }
}
