import { Component } from '@angular/core';
import { RevealDirective } from '../reveal.directive';
import { ScrollToDirective } from '../scroll-to.directive';

/**
 * Closing Statement — full-width navy band with a centered editorial quote.
 * The quote fades in with a slight letter-spacing tighten for an editorial feel;
 * a single CTA sits below.
 */
@Component({
  selector: 'app-closing-statement',
  imports: [RevealDirective, ScrollToDirective],
  templateUrl: './closing-statement.component.html',
  styleUrl: './closing-statement.component.scss',
})
export class ClosingStatementComponent {}
