import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * 404 — catch-all route (master doc Section 12.3). On-brand navy/gold/cream
 * error page with clear navigation back to Home and Contact.
 */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
})
export class NotFoundComponent {}
