import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../reveal.directive';
import { IndustryCard, IndustrySector } from './industries-data';
import { ImageSrcPipe } from '../core/image-src.pipe';
import { ImageSrcsetPipe } from '../core/image-variants.pipe';

/**
 * Shared "Industries" block Ã¢â‚¬â€ the tiered photo-card grid plus additional-sector
 * tiles. Used on the homepage; there is no separate /industries index page.
 *
 * Core cards link to their `/industries/[slug]` pages when a `link` is present.
 */
@Component({
  selector: 'app-industries-section',
  imports: [RouterLink, RevealDirective, ImageSrcPipe, ImageSrcsetPipe],
  templateUrl: './industries-section.component.html',
  styleUrl: './industries-section.component.scss',
})
export class IndustriesSectionComponent {
  @Input() eyebrow = '';
  @Input() title = 'Industries';
  @Input() lead = '';
  @Input() centered = true;
  /** Optional anchor id for the section (also names the header for aria). */
  @Input() sectionId = '';
  /** Set to false when the page already provides its own heading. */
  @Input() showHeader = true;
  /** Removes the top padding so the band flows straight after a hero. */
  @Input() compact = false;
  @Input() core: IndustryCard[] = [];
  @Input() sectors: IndustrySector[] = [];
}
