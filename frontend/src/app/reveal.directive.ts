import { Directive, ElementRef, inject, Input, OnInit, Renderer2 } from '@angular/core';

/**
 * Scroll-reveal directive.
 *
 * Adds the `reveal` class to its host element immediately, then observes the
 * element with an IntersectionObserver. When the element first enters the
 * viewport it receives the `is-revealed` class (CSS drives the fade/slide up)
 * and the observer is disconnected so the animation triggers only once.
 *
 * Usage: <section appReveal appRevealDelay="150">
 */
@Directive({
  selector: '[appReveal]',
})
export class RevealDirective implements OnInit {
  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  /** Optional stagger delay in ms (applied as a CSS transition-delay). */
  @Input() appRevealDelay = 0;

  ngOnInit(): void {
    const host = this.element.nativeElement;

    // Reduced-motion users and very old browsers get content immediately.
    const reducedMotion = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const unsupported = typeof IntersectionObserver === 'undefined';

    this.renderer.addClass(host, 'reveal');
    if (this.appRevealDelay) {
      host.style.setProperty('--reveal-delay', `${this.appRevealDelay}ms`);
    }

    if (reducedMotion || unsupported) {
      this.renderer.addClass(host, 'is-revealed');
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          this.renderer.addClass(host, 'is-revealed');
          observer.disconnect();
          break;
        }
      }
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -8% 0px',
    });

    observer.observe(host);
  }
}
