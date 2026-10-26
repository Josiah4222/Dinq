import { Component, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../reveal.directive';
import { CmsPage } from '../core/cms-page';
import { ImageSrcPipe } from '../core/image-src.pipe';
import { ImageSrcsetPipe } from '../core/image-variants.pipe';

/** One of the approach pillars. */
interface Pillar {
  /** Stable row id, so an editor can retitle or reorder without losing the row. */
  key: string;
  title: string;
  text: string;
  [field: string]: string;
}

/**
 * /about/our-approach ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â the approach page on its own: hero, the two-paragraph
 * explanation of what Dinq is for, the pillars that follow from it, and the
 * contact CTA.
 *
 * Copy is read from the `our-approach` page in the CMS and layered over the
 * values below. The values in this file are the shipped copy and the fallback
 * for every key, so the page renders identically whether the API answers,
 * answers with nothing, or is unreachable.
 */
@Component({
  selector: 'app-our-approach',
  imports: [RouterLink, RevealDirective, ImageSrcPipe, ImageSrcsetPipe],
  templateUrl: './our-approach.component.html',
  styleUrl: './our-approach.component.scss',
})
export class OurApproachComponent extends CmsPage implements OnInit {
  /* ---- Hero ----------------------------------------------------------------- */
  readonly heroImage = computed(() =>
    this.content.text(this.values(), 'hero.image', '/media/assets/images/hero-addis.jpg'),
  );
  readonly heroEyebrow = computed(() => this.content.text(this.values(), 'hero.eyebrow', 'About Dinq Advisory Group'));
  readonly heroTitle = computed(() => this.content.text(this.values(), 'hero.title', 'Our Approach'));

  /* ---- Approach ------------------------------------------------------------- */
  readonly approachEyebrow = computed(() => this.content.text(this.values(), 'approach.eyebrow', 'Our Approach'));
  readonly approachHeading = computed(() =>
    this.content.text(this.values(), 'approach.heading', 'One Relationship. From Strategy to Execution.'),
  );
  readonly approachIntro = computed<string[]>(() =>
    this.content.list<string>(this.values(), 'approach.intro', INTRO_FALLBACK),
  );
  readonly approachPillars = computed<Pillar[]>(() =>
    this.content.list<Pillar>(this.values(), 'approach.pillars', PILLAR_FALLBACK),
  );
  readonly approachCta = computed(() => this.content.text(this.values(), 'approach.cta', 'Speak With Dinq'));

  ngOnInit(): void {
    this.bind('our-approach');
  }
}

/* The shipped copy, and the fallback for every key above. Keeping it here means
   the page is complete without the CMS, and the seed in backend/cms matches. */
const INTRO_FALLBACK: string[] = [
  'Entering a new market, investing from abroad, or managing assets remotely can require lawyers, consultants, government contacts, technical specialists, property managers, and local representatives. When these parties operate independently, the client is left to coordinate the process.',
  'Dinq is designed to solve that problem. We act as the central advisory and implementation relationship ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â helping clients understand the opportunity, make informed decisions, coordinate the right expertise, execute locally, and remain informed over time.',
];

const PILLAR_FALLBACK: Pillar[] = [
  {
    key: 'international-perspective-local-execution',
    title: 'International Perspective + Local Execution',
    text: 'We understand the expectations of international clients while working within the commercial and institutional realities of Ethiopia.',
  },
  {
    key: 'advice-implementation',
    title: 'Advice + Implementation',
    text: 'We do not treat a strategy document as the end of the engagement. Where appropriate, we help turn the strategy into action.',
  },
  {
    key: 'local-presence-accountability',
    title: 'Local Presence + Professional Accountability',
    text: 'Clients who cannot be on the ground need more than informal assistance. Dinq provides structured coordination, communication, and reporting.',
  },
  {
    key: 'integrated-professional-support',
    title: 'Integrated Professional Support',
    text: 'When legal or specialized professional work is required, Dinq coordinates the relevant expertise rather than leaving the client to assemble the team alone.',
  },
  {
    key: 'long-term-stewardship',
    title: 'Long-Term Stewardship',
    text: 'Our work can continue after market entry, acquisition, or project launch through ongoing advisory, asset oversight, reporting, and local representation.',
  },
];
