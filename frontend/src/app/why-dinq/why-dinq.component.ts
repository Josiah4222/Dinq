import { Component } from '@angular/core';
import { RevealDirective } from '../reveal.directive';

/**
 * Why Dinq — breathing-space section between the hero and the busier content.
 * A quiet, centered two-column text block with no imagery.
 */
@Component({
  selector: 'app-why-dinq',
  imports: [RevealDirective],
  templateUrl: './why-dinq.component.html',
  styleUrl: './why-dinq.component.scss',
})
export class WhyDinqComponent {}
