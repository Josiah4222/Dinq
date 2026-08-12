import { Component } from '@angular/core';
import { RevealDirective } from '../reveal.directive';

/**
 * Our Solutions — five numbered rows (label + supporting sentence each).
 * No links: subpages don't exist on this holding page.
 */
@Component({
  selector: 'app-solutions',
  imports: [RevealDirective],
  templateUrl: './solutions.component.html',
  styleUrl: './solutions.component.scss',
})
export class SolutionsComponent {
  readonly solutions = [
    {
      title: 'International Business & Investment Advisory',
      text: 'Helping organizations establish, expand, and invest confidently in Ethiopia.',
    },
    {
      title: 'Diaspora Advisory',
      text: 'Helping Ethiopians abroad invest, relocate, establish businesses, and protect family interests through trusted local representation.',
    },
    {
      title: 'Property & Asset Management',
      text: 'Managing commercial, residential, and family assets through professional oversight, reporting, tenant coordination, construction monitoring, and long-term stewardship.',
    },
    {
      title: 'Government & Institutional Advisory',
      text: 'Supporting governments, development agencies, NGOs, and institutional investors with strategic advisory, stakeholder engagement, and implementation support.',
    },
    {
      title: 'HR Related Services',
      text: 'Workforce planning, HR reorganization, and recruitment support, plus operational training programs tailored to our real estate, manufacturing, and mining clients.',
    },
  ];
}
