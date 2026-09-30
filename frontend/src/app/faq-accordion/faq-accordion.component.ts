import { Component, Input } from '@angular/core';

export interface FaqItem {
  q: string;
  a: string;
}

/**
 * Reusable accordion — one item open at a time. Used on Solutions detail pages
 * (Section 6.2) and reusable anywhere FAQ content is needed.
 */
@Component({
  selector: 'app-faq-accordion',
  imports: [],
  templateUrl: './faq-accordion.component.html',
  styleUrl: './faq-accordion.component.scss',
})
export class FaqAccordionComponent {
  @Input() items: FaqItem[] = [];

  /** Index of the currently open item, or null when all are collapsed. */
  openIndex: number | null = null;

  toggle(index: number): void {
    this.openIndex = this.openIndex === index ? null : index;
  }
}
