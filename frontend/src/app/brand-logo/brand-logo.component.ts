import { Component, Input } from '@angular/core';

/**
 * Dinq brand logo — the official gold lockup (`public/dinq_gold_premium.png`),
 * sized for the context it appears in via the `size` input.
 */
@Component({
  selector: 'app-brand-logo',
  imports: [],
  templateUrl: './brand-logo.component.html',
  styleUrl: './brand-logo.component.scss',
})
export class BrandLogoComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  // Root-absolute. A relative value is resolved by the browser against the
  // current URL, so on any route below the homepage this 404s.
  readonly src = '/dinq_gold_premium.png';
}
