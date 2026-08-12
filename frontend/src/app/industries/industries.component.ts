import { Component } from '@angular/core';
import { RevealDirective } from '../reveal.directive';

/**
 * Industries — three equal-weight photography cards (core sectors only).
 * Hover lifts the card gently; a navy overlay keeps labels legible.
 */
@Component({
  selector: 'app-industries',
  imports: [RevealDirective],
  templateUrl: './industries.component.html',
  styleUrl: './industries.component.scss',
})
export class IndustriesComponent {
  readonly industries = [
    {
      index: '01',
      title: 'Real Estate',
      text: 'Commercial and residential opportunities for diaspora and foreign investors.',
      image: 'assets/images/industries-realestate.jpg',
      alt: 'Modern high-rise building in Addis Ababa',
    },
    {
      index: '02',
      title: 'Manufacturing',
      text: 'Industrial-park entry, import/export structuring, and incentive navigation.',
      image: 'assets/images/industries-manufacturing.jpg',
      alt: 'Industrial facility with pipes and machinery',
    },
    {
      index: '03',
      title: 'Mining',
      text: 'Concession strategy and regulatory guidance for specialized, high-value mandates.',
      image: 'assets/images/industries-mining.jpg',
      alt: 'Aerial view of heavy mining equipment on an open site',
    },
  ];
}
