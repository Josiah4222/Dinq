import { Component, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../reveal.directive';
import { HowWeWorkComponent } from '../how-we-work/how-we-work.component';
import { CmsPage } from '../core/cms-page';
import { ImageSrcPipe } from '../core/image-src.pipe';

/** A two-field card: the value cards. */
interface TitledCard {
  /** Stable row id, so an editor can retitle or reorder without losing the row. */
  key: string;
  title: string;
  text: string;
  [field: string]: string;
}

/**
 * /about/who-we-are ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â the shorter story of the firm: hero, who we are, vision,
 * mission, purpose, values, how we work, and why the firm is called Dinq.
 *
 * Copy is read from the `who-we-are` page in the CMS and layered over the
 * values below. The values in this file are the shipped copy and the fallback
 * for every key, so the page renders identically whether the API answers,
 * answers with nothing, or is unreachable.
 *
 * The four-step timeline itself is the shared <app-how-we-work> component,
 * which owns its own copy and is not editable from this page's editor. The ids
 * on each <section> are the anchor targets used by the nav, so they stay in
 * code.
 */
@Component({
  selector: 'app-who-we-are',
  imports: [RouterLink, RevealDirective, HowWeWorkComponent, ImageSrcPipe],
  templateUrl: './who-we-are.component.html',
  styleUrl: './who-we-are.component.scss',
})
export class WhoWeAreComponent extends CmsPage implements OnInit {
  /* ---- Hero ----------------------------------------------------------------- */
  readonly heroImage = computed(() =>
    this.content.text(this.values(), 'hero.image', '/media/assets/images/hero-addis.jpg'),
  );
  readonly heroEyebrow = computed(() => this.content.text(this.values(), 'hero.eyebrow', 'About Dinq Advisory Group'));
  readonly heroTitle = computed(() => this.content.text(this.values(), 'hero.title', 'Who We Are'));

  /* ---- Who We Are ------------------------------------------------------------ */
  readonly whoWeAreEyebrow = computed(() => this.content.text(this.values(), 'whoWeAre.eyebrow', 'Who We Are'));
  readonly whoWeAreHeading = computed(() =>
    this.content.text(this.values(), 'whoWeAre.heading', 'An integrated cross-border advisory firm'),
  );
  readonly whoWeAreParagraphs = computed<string[]>(() =>
    this.content.list<string>(this.values(), 'whoWeAre.paragraphs', WHO_WE_ARE_FALLBACK),
  );
  readonly whoWeAreTagline = computed(() =>
    this.content.text(this.values(), 'whoWeAre.tagline', 'Connecting Opportunity Across Borders.'),
  );

  /* ---- Vision & Mission ----------------------------------------------------- */
  readonly visionEyebrow = computed(() => this.content.text(this.values(), 'vision.eyebrow', 'Our Vision'));
  readonly visionText = computed(() =>
    this.content.text(
      this.values(),
      'vision.text',
      'To become a leading cross-border advisory firm connecting international capital, expertise, and opportunity with Ethiopia and the broader East African region through trusted relationships, practical execution, and long-term value creation.',
    ),
  );
  readonly missionEyebrow = computed(() => this.content.text(this.values(), 'mission.eyebrow', 'Our Mission'));
  readonly missionText = computed(() =>
    this.content.text(
      this.values(),
      'mission.text',
      'To simplify investing, doing business, and managing assets in Ethiopia by providing integrated strategic advisory, implementation support, and coordinated professional solutions through one trusted relationship.',
    ),
  );

  /* ---- Purpose -------------------------------------------------------------- */
  readonly purposeEyebrow = computed(() => this.content.text(this.values(), 'purpose.eyebrow', 'Our Purpose'));
  readonly purposeHeading = computed(() =>
    this.content.text(
      this.values(),
      'purpose.heading',
      'To bridge the gap between international opportunity and successful local execution.',
    ),
  );
  readonly purposeParagraphs = computed<string[]>(() =>
    this.content.list<string>(this.values(), 'purpose.paragraphs', PURPOSE_FALLBACK),
  );

  /* ---- Our Values ----------------------------------------------------------- */
  readonly valuesEyebrow = computed(() => this.content.text(this.values(), 'values.eyebrow', 'Our Values'));
  readonly valuesHeading = computed(() => this.content.text(this.values(), 'values.heading', 'What guides every engagement'));
  readonly valueItems = computed<TitledCard[]>(() => this.content.list<TitledCard>(this.values(), 'values.items', VALUE_FALLBACK));

  /* ---- How We Work ---------------------------------------------------------- */
  readonly howWeWorkEyebrow = computed(() => this.content.text(this.values(), 'howWeWork.eyebrow', 'How We Work'));
  readonly howWeWorkHeading = computed(() =>
    this.content.text(this.values(), 'howWeWork.heading', 'A complete journey, not a one-off engagement'),
  );
  readonly howWeWorkParagraphs = computed<string[]>(() =>
    this.content.list<string>(this.values(), 'howWeWork.paragraphs', HOW_WE_WORK_FALLBACK),
  );
  readonly ctaText = computed(() => this.content.text(this.values(), 'cta.text', 'Speak With Dinq'));

  /* ---- Why "Dinq"? --------------------------------------------------------- */
  readonly whyDinqAmharic = computed(() => this.content.text(this.values(), 'whyDinq.amharic', 'ÃƒÂ¡Ã¢â‚¬Â¹Ã‚ÂµÃƒÂ¡Ã…Â Ã¢â‚¬Â¢ÃƒÂ¡Ã¢â‚¬Â°Ã¢â‚¬Â¦'));
  readonly whyDinqEyebrow = computed(() => this.content.text(this.values(), 'whyDinq.eyebrow', 'Why ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œDinqÃƒÂ¢Ã¢â€šÂ¬Ã‚Â?'));
  readonly whyDinqText = computed(() =>
    this.content.text(
      this.values(),
      'whyDinq.text',
      'The name Dinq comes from the Amharic word ÃƒÂ¡Ã¢â‚¬Â¹Ã‚ÂµÃƒÂ¡Ã…Â Ã¢â‚¬Â¢ÃƒÂ¡Ã¢â‚¬Â°Ã¢â‚¬Â¦, meaning extraordinary, remarkable, or a marvel. It reflects our commitment to exceptional outcomes while honoring our deep connection to Ethiopia. For us, ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œDinqÃƒÂ¢Ã¢â€šÂ¬Ã‚Â is not simply a name; it represents the standard we aim to bring to every engagement through sound judgment, trusted execution, and enduring partnerships.',
    ),
  );
  readonly whyDinqFootnote = computed(() =>
    this.content.text(
      this.values(),
      'whyDinq.footerNote',
      'Dinq (ÃƒÂ¡Ã¢â‚¬Â¹Ã‚ÂµÃƒÂ¡Ã…Â Ã¢â‚¬Â¢ÃƒÂ¡Ã¢â‚¬Â°Ã¢â‚¬Â¦) is Amharic for extraordinary or remarkable ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â the standard we bring to every engagement.',
    ),
  );

  ngOnInit(): void {
    this.bind('who-we-are');
  }
}

/* The shipped copy, and the fallback for every key above. Keeping it here means
   the page is complete without the CMS, and the seed in backend/cms matches. */
const WHO_WE_ARE_FALLBACK: string[] = [
  'Dinq Advisory Group is an integrated cross-border advisory firm helping international businesses, investors, institutions, and members of the Ethiopian diaspora successfully invest, establish, operate, and manage their interests in Ethiopia.',
  'Unlike traditional consulting firms that stop at strategy, or professional service providers that address only one part of a mandate, Dinq supports the complete journey ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â from opportunity assessment and strategic planning to implementation, coordination, local representation, and ongoing asset stewardship.',
  'Working in strategic collaboration with Kairos Law where legal services are required, Dinq combines commercial advisory, local execution, and coordinated professional support into one integrated client experience. Our clients gain more than advice: they gain a trusted partner on the ground.',
];

const PURPOSE_FALLBACK: string[] = [
  'Many organizations have strong ideas. Many investors have capital. Many members of the diaspora want to invest, contribute, or protect what they have built. The challenge is often execution: finding a trusted team that understands both international expectations and the realities of operating locally.',
  'Dinq exists to bridge that gap.',
];

const VALUE_FALLBACK: TitledCard[] = [
  {
    key: 'integrity',
    title: 'Integrity',
    text: 'We build trust through transparency, professionalism, and ethical decision-making.',
  },
  {
    key: 'partnership',
    title: 'Partnership',
    text: 'We succeed when our clients succeed.',
  },
  {
    key: 'excellence',
    title: 'Excellence',
    text: 'We pursue exceptional outcomes through disciplined execution and attention to detail.',
  },
  {
    key: 'collaboration',
    title: 'Collaboration',
    text: 'The best solutions come from combining expertise across disciplines.',
  },
  {
    key: 'practicality',
    title: 'Practicality',
    text: 'Advice only creates value when it can be successfully implemented.',
  },
  {
    key: 'stewardship',
    title: 'Stewardship',
    text: 'We approach each client\'s business, investment, and assets with care, accountability, and a long-term perspective.',
  },
];

const HOW_WE_WORK_FALLBACK: string[] = [
  'Dinq is designed around the full arc of a cross-border engagement. We do not hand off after the strategy ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â we remain engaged to help clients execute locally, stay informed, and protect what they have built. Every engagement follows the same four-step journey, from first assessment through long-term stewardship.',
];
