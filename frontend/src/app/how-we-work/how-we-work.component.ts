import { Component } from '@angular/core';
import { RevealDirective } from '../reveal.directive';

/**
 * How We Work — the brand's signature visual: four steps (Assess / Advise /
 * Implement / Support) connected by a hairline that draws in AFTER the steps
 * have entered, left to right.
 *
 * The entrance sequence is orchestrated purely in CSS:
 *   .how.is-revealed .step   -> steps fade/slide up, staggered by --step-i
 *   .how.is-revealed .steps__line -> hairline scales from 0 after ~1.2s
 */
@Component({
  selector: 'app-how-we-work',
  imports: [RevealDirective],
  templateUrl: './how-we-work.component.html',
  styleUrl: './how-we-work.component.scss',
})
export class HowWeWorkComponent {
  readonly steps = [
    {
      title: 'Assess',
      text: 'We begin by understanding your objectives, identifying opportunities, evaluating risks, and defining a practical roadmap.',
    },
    {
      title: 'Advise',
      text: 'We develop commercially sound strategies supported by local market insight and coordinated legal guidance where required.',
    },
    {
      title: 'Implement',
      text: 'We help execute the strategy by coordinating stakeholders, engaging with government authorities, managing projects, and supporting transactions.',
    },
    {
      title: 'Support',
      text: 'Our relationship continues through ongoing advisory, property and asset management, reporting, governance support, and trusted local representation.',
    },
  ];
}
