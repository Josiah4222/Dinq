import { Component } from '@angular/core';
import { TestBed, fakeAsync } from '@angular/core/testing';
import { ScrollToDirective } from './scroll-to.directive';

/**
 * The Why Ethiopia anchor nav renders a real `href` so a copied link is a
 * working deep link, and `appScrollTo` so the click itself lands below the
 * navbar and the sticky nav bar instead of behind them.
 */
@Component({
  imports: [ScrollToDirective],
  template: `
    <nav>
      <a href="#tax-corporate" [appScrollTo]="'tax-corporate'">Tax</a>
    </nav>
    <section id="tax-corporate">Tax section</section>
  `,
})
class HostComponent {}

describe('ScrollToDirective', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('keeps the href for a no-JS fallback and for sharing the link', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('#tax-corporate');
    fixture.destroy();
  });

  it('intercepts the click and scrolls the target into view', fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const scrolled: string[] = [];
    const original = Element.prototype.scrollIntoView;
    // scrollIntoView is not implemented in the test DOM, so record the call.
    Element.prototype.scrollIntoView = function (this: Element) {
      scrolled.push(this.id);
    } as typeof Element.prototype.scrollIntoView;

    try {
      const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      link.dispatchEvent(event);

      expect(scrolled).toEqual(['tax-corporate']);
      // The router's anchorScrolling must not also handle it, or the two
      // scroll the page to different places and the heading ends up hidden.
      expect(event.defaultPrevented).toBe(true);
    } finally {
      Element.prototype.scrollIntoView = original;
      fixture.destroy();
    }
  }));

  it('does not throw when the target is missing, leaving the page where it is', () => {
    @Component({
      imports: [ScrollToDirective],
      template: `<a href="#nope" [appScrollTo]="'nope'">Missing</a>`,
    })
    class MissingHost {}

    const fixture = TestBed.createComponent(MissingHost);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(() => link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })))
      .not.toThrow();
    fixture.destroy();
  });
});
