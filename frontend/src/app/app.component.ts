import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';

/** Routes that get the staff chrome instead of the public site chrome. */
const STAFF_PATHS = ['/admin', '/login'];

/**
 * Root component — the app shell.
 *
 * The public navbar and footer wrap the routed page content for the whole
 * marketing site. The staff area is deliberately excluded: those pages carry
 * their own header, sidebar and sign-out, and the public nav would be dead
 * weight there (and a stray way out of a staff screen).
 */
@Component({
  selector: 'app-root',
  imports: [NavbarComponent, RouterOutlet, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly router = inject(Router);

  private readonly currentUrl = signal(this.router.url);

  /** True on /admin and /login, where the public chrome is suppressed. */
  readonly isStaffArea = computed(() =>
    STAFF_PATHS.some(path => this.currentUrl() === path || this.currentUrl().startsWith(`${path}/`)),
  );

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.currentUrl.set(event.urlAfterRedirects));
  }
}
