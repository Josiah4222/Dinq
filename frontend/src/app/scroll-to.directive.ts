import { Directive, HostListener, inject, Input } from '@angular/core';

/**
 * Smooth-scroll directive for same-page anchor navigation.
 *
 * Attach to any anchor/button with a target element id, e.g.
 *   <a href="#contact" appScrollTo="contact">Contact Us</a>
 *
 * Keeps a real `href` for semantics and no-JS fallback, then upgrades the
 * interaction to a smooth scrollIntoView. Respects prefers-reduced-motion by
 * falling back to an instant jump.
 */
@Directive({
  selector: '[appScrollTo]',
})
export class ScrollToDirective {
  /** Id of the target element on this page. Special value 'top' scrolls to 0. */
  @Input({ required: true }) appScrollTo = '';

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    event.preventDefault();

    const smooth = typeof window.matchMedia === 'function'
      && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (this.appScrollTo === 'top') {
      window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
      return;
    }

    const target = document.getElementById(this.appScrollTo);
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  }
}
