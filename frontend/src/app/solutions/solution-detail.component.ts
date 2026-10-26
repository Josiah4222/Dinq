import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FaqAccordionComponent } from '../faq-accordion/faq-accordion.component';
import { HowWeWorkComponent } from '../how-we-work/how-we-work.component';
import { PropertyLeadFormComponent } from './property-lead-form.component';
import { RevealDirective } from '../reveal.directive';
import { SOLUTION_DETAILS, SolutionDetail } from './solutions-data';
import { getIndustryPills, IndustryLink } from '../industry-links';
import { CmsPage } from '../core/cms-page';
import { FieldMap, overlay } from '../core/cms-merge';
import { ImageSrcPipe } from '../core/image-src.pipe';
import { ImageSrcsetPipe } from '../core/image-variants.pipe';

/**
 * Which fields of a solution are editable, and the CMS key that overrides each.
 * The key is what the public page looks up by; the field is the property on the
 * object the template renders. `slug` is absent on purpose -- it is what the
 * route resolves, so it is structure rather than copy.
 */
const EDITABLE: FieldMap<keyof SolutionDetail & string>[] = [
  { field: 'title', key: 'title' },
  { field: 'summary', key: 'summary' },
  { field: 'headline', key: 'headline' },
  { field: 'tagline', key: 'tagline' },
  { field: 'heroImage', key: 'heroImage' },
  { field: 'opportunity', key: 'opportunity' },
  { field: 'challenges', key: 'challenges', list: true },
  { field: 'approach', key: 'approach' },
  { field: 'delivery', key: 'delivery', list: true },
  { field: 'deliveryHeading', key: 'deliveryHeading' },
  { field: 'closing', key: 'closing' },
  { field: 'whyDinq', key: 'whyDinq' },
  { field: 'faq', key: 'faq', list: true },
  { field: 'ctaLabel', key: 'ctaLabel' },
];

/**
 * Reusable Solutions detail template (master doc Section 6.2).
 * Fully data-driven: every block reads from the matching SolutionDetail entry.
 *
 * The static entry in solutions-data.ts is the fallback and the shape; the CMS
 * values are laid over it, so this page keeps working with no API and a staff
 * save repaints the open tab without a reload.
 */
@Component({
  selector: 'app-solution-detail',
  imports: [
    RouterLink,
    DecimalPipe,
    FaqAccordionComponent,
    HowWeWorkComponent,
    PropertyLeadFormComponent,
    RevealDirective,
    ImageSrcPipe,
    ImageSrcsetPipe,
  ],
  templateUrl: './solution-detail.component.html',
  styleUrl: './solution-detail.component.scss',
})
export class SolutionDetailComponent extends CmsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /** The static entry for this slug, kept so the overlay has something to build on. */
  private base = signal<SolutionDetail | null>(null);

  /** Industries linking to this solution, derived from the industry data. */
  readonly industries = signal<IndustryLink[]>([]);
  /** True when the list was truncated, so the "view all" pill is shown. */
  readonly industriesCollapsed = signal(false);

  /** The page as rendered: the static entry with the CMS values on top. */
  readonly detail = computed(() => {
    const base = this.base();
    return base === null ? null : overlay(base, this.values(), EDITABLE);
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug') ?? '';
      const detail = SOLUTION_DETAILS[slug];
      if (!detail) {
        void this.router.navigate(['/solutions']);
        return;
      }
      this.base.set(detail);
      // The CMS page is namespaced so a solution and an industry can never
      // collide on a slug.
      this.bind(`solution-${slug}`);

      const { industries, collapsed } = getIndustryPills(slug);
      this.industries.set(industries);
      this.industriesCollapsed.set(collapsed);
    });
  }
}
