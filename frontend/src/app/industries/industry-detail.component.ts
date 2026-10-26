import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RevealDirective } from '../reveal.directive';
import { INDUSTRY_DETAILS, IndustryDetail } from './industries-data';
import { CmsPage } from '../core/cms-page';
import { FieldMap, overlay } from '../core/cms-merge';
import { ImageSrcPipe } from '../core/image-src.pipe';
import { ImageSrcsetPipe } from '../core/image-variants.pipe';

/**
 * Which fields of a sector page are editable, and the CMS key for each.
 * `support` and `supportCopy` are alternatives in the data: the core industries
 * use the bullet list, the lighter sectors use the prose. Only the one a page
 * actually has is seeded, and the template already prefers the prose when
 * present, so editing either surface behaves the same way.
 */
const EDITABLE: FieldMap<keyof IndustryDetail & string>[] = [
  { field: 'title', key: 'title' },
  { field: 'summary', key: 'summary' },
  { field: 'heroImage', key: 'heroImage' },
  { field: 'lede', key: 'lede' },
  { field: 'opportunity', key: 'opportunity' },
  { field: 'clientNeeds', key: 'clientNeeds', list: true },
  { field: 'support', key: 'support', list: true },
  { field: 'supportCopy', key: 'supportCopy' },
  { field: 'ctaLabel', key: 'ctaLabel' },
];

/**
 * Reusable Industries detail template (master doc Section 7.2).
 * Fully data-driven from INDUSTRY_DETAILS Ã¢â‚¬â€ Manufacturing and Mining can be
 * added later with data only.
 *
 * The static entry stays the fallback and the source of structure; the CMS
 * values are laid over it so a save repaints the open tab.
 */
@Component({
  selector: 'app-industry-detail',
  imports: [RouterLink, RevealDirective, ImageSrcPipe, ImageSrcsetPipe],
  templateUrl: './industry-detail.component.html',
  styleUrl: './industry-detail.component.scss',
})
export class IndustryDetailComponent extends CmsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private base = signal<IndustryDetail | null>(null);

  /** The page as rendered: the static entry with the CMS values on top. */
  readonly detail = computed(() => {
    const base = this.base();
    return base === null ? null : overlay(base, this.values(), EDITABLE);
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug') ?? '';
      const detail = INDUSTRY_DETAILS[slug];
      if (!detail) {
        void this.router.navigate(['/'], { fragment: 'industries' });
        return;
      }
      this.base.set(detail);
      this.bind(`industry-${slug}`);
    });
  }
}
