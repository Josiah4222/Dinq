import { Component, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HowWeWorkComponent } from '../how-we-work/how-we-work.component';
import { RevealDirective } from '../reveal.directive';
import { getIndustryPills, IndustryLink } from '../industry-links';
import { SOLUTION_CARDS, SolutionCard } from './solutions-data';
import { CmsPage } from '../core/cms-page';

/** A card plus the industries that link back to it, for the pill row. */
interface SolutionCardView extends SolutionCard {
  industries: IndustryLink[];
  industriesCollapsed: boolean;
}

/**
 * Read one stored card field, falling back to the shipped card.
 * `slug` is never read from the CMS: it is what the row links to, so a typo in a
 * text field would break navigation rather than change the copy.
 */
function cardText(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim().length) {
    return value;
  }
  if (value && typeof value === 'object' && typeof (value as Record<string, unknown>)['title'] === 'string') {
    const title = (value as Record<string, string>)['title'];
    if (title.trim().length) {
      return title;
    }
  }
  return fallback;
}

/**
 * /solutions — index page.
 *
 * All five solutions are presented as one equal-weight editorial list. The
 * earlier 3-then-2 grid gave the first three a wider span for no content
 * reason; a single full-width row per solution removes the awkward remainder
 * and leaves room for the industry pills.
 *
 * The pills come from `getIndustryPills`, the same helper the solution detail
 * pages use, so both directions read one source.
 *
 * Unlike the insights index, the cards are this page's own copy. A card blurb is
 * a different, shorter piece of writing from a solution's detail summary, so
 * each is edited where it is rendered. The card *title* is deliberately taken
 * from the static entry instead: it must match the detail page's title or the
 * two would disagree, and each solution already has a page for editing that.
 */
@Component({
  selector: 'app-solutions-index',
  imports: [RouterLink, RevealDirective, HowWeWorkComponent],
  templateUrl: './solutions-index.component.html',
  styleUrl: './solutions-index.component.scss',
})
export class SolutionsIndexComponent extends CmsPage implements OnInit {
  readonly eyebrow = computed(() => this.content.text(this.values(), 'hero.eyebrow', 'Solutions'));
  readonly title = computed(() =>
    this.content.text(this.values(), 'hero.title', 'Advisory built around what it takes to get things done.'),
  );
  readonly intro = computed(() =>
    this.content.text(
      this.values(),
      'hero.intro',
      'Dinq Advisory Group helps businesses, investors, institutions, and members of the Ethiopian ' +
        'diaspora navigate opportunities and manage interests in Ethiopia. We go beyond ' +
        'recommendations — helping clients assess opportunities, make informed decisions, coordinate ' +
        'the right professionals and stakeholders, and follow through on implementation.',
    ),
  );
  readonly whatWeDoEyebrow = computed(() => this.content.text(this.values(), 'cards.eyebrow', 'What we do'));
  readonly solutionsTitle = computed(() => this.content.text(this.values(), 'cards.title', 'Five practice areas'));
  readonly ctaTitle = computed(() => this.content.text(this.values(), 'cta.title', 'Not sure which solution fits?'));
  readonly ctaText = computed(() =>
    this.content.text(
      this.values(),
      'cta.text',
      "Every engagement starts with a conversation. Tell us where you're headed, and we'll " +
        'map the path together.',
    ),
  );

  readonly solutions = computed<SolutionCardView[]>(() => {
    const stored = this.values()?.['cards'];
    const rows = Array.isArray(stored) ? stored : [];
    return SOLUTION_CARDS.map((card, index) => {
      const row = (rows[index] ?? {}) as Record<string, unknown>;
      const merged: SolutionCard = {
        ...card,
        index: cardText(row['index'], card.index),
        // Kept from the static entry so the grid always matches the detail page.
        title: card.title,
        text: cardText(row['text'], card.text),
      };
      const { industries, collapsed } = getIndustryPills(card.slug);
      return { ...merged, industries, industriesCollapsed: collapsed };
    });
  });

  ngOnInit(): void {
    this.bind('solutions');
  }
}
