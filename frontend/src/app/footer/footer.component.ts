import { Component } from '@angular/core';
import { BrandLogoComponent } from '../brand-logo/brand-logo.component';

/**
 * Footer — navy band with brand lockup, tagline, contact channels, legal
 * placeholder links and social icons.
 */
@Component({
  selector: 'app-footer',
  imports: [BrandLogoComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
}
