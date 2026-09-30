import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Footer — navy band with brand lockup, tagline, company/resources/contact
 * columns, and legal links.
 */
@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
}
