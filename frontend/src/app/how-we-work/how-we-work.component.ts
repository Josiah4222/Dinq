import { Component, input, InputSignal } from '@angular/core';
import { HOW_WE_WORK_STEPS } from './how-we-work-data';

/**
 * Reusable four-step ASSESS / ADVISE / IMPLEMENT / SUPPORT timeline.
 *
 * Data comes from the shared HOW_WE_WORK_STEPS constant — this component never
 * hard-codes the step copy. The `mode` input switches between the compact
 * homepage treatment and the larger full treatment used on /about/who-we-are
 * and solution detail pages.
 */
@Component({
  selector: 'app-how-we-work',
  imports: [],
  templateUrl: './how-we-work.component.html',
  styleUrl: './how-we-work.component.scss',
})
export class HowWeWorkComponent {
  readonly mode: InputSignal<'compact' | 'full'> = input<'compact' | 'full'>('compact');
  readonly steps = HOW_WE_WORK_STEPS;
}
