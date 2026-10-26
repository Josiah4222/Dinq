import { Component, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../reveal.directive';
import { CmsPage } from '../core/cms-page';
import { ImageSrcPipe } from '../core/image-src.pipe';
import { ImageSrcsetPipe, ImageWebpPipe } from '../core/image-variants.pipe';

/** A two-field card: the value/step cards and the approach pillars. */
interface TitledCard {
  /** Stable row id, so an editor can retitle or reorder without losing the row. */
  key: string;
  title: string;
  text: string;
  [field: string]: string;
}

/**
 * /about ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â the long-form About page: hero, who we are, vision, mission,
 * purpose, values, how we work, our approach, the Kairos alliance, and why
 * the firm is called Dinq.
 *
 * Copy is read from the `about` page in the CMS and layered over the values
 * below. The values in this file are the shipped copy and the fallback for
 * every key, so the page renders identically whether the API answers, answers
 * with nothing, or is unreachable. Staff edit it under /admin/pages, and a save
 * reaches this tab without a reload.
 *
 * The ids on each <section> element are the anchor targets used by the nav, so
 * they are structural and stay in code.
 */
@Component({
  selector: 'app-about',
  imports: [RouterLink, RevealDirective, ImageSrcPipe, ImageSrcsetPipe, ImageWebpPipe],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent extends CmsPage implements OnInit {
  /* ---- Hero ----------------------------------------------------------------- */
  readonly heroImage = computed(() =>
    this.content.text(this.values(), 'hero.image', '/media/assets/images/hero-addis.jpg'),
  );
  readonly heroEyebrow = computed(() => this.content.text(this.values(), 'hero.eyebrow', 'About Dinq Advisory Group'));
  readonly heroTitle = computed(() => this.content.text(this.values(), 'hero.title', 'Connecting Opportunity Across Borders.'));

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
  readonly stepsEyebrow = computed(() => this.content.text(this.values(), 'steps.eyebrow', 'How We Work'));
  readonly stepsHeading = computed(() =>
    this.content.text(this.values(), 'steps.heading', 'A complete journey, not a one-off engagement'),
  );
  readonly stepItems = computed<TitledCard[]>(() => this.content.list<TitledCard>(this.values(), 'steps.items', STEP_FALLBACK));

  /* ---- Our Approach --------------------------------------------------------- */
  readonly approachEyebrow = computed(() => this.content.text(this.values(), 'approach.eyebrow', 'Our Approach'));
  readonly approachHeading = computed(() =>
    this.content.text(this.values(), 'approach.heading', 'One Relationship. From Strategy to Execution.'),
  );
  readonly approachIntro = computed<string[]>(() =>
    this.content.list<string>(this.values(), 'approach.intro', APPROACH_INTRO_FALLBACK),
  );
  readonly approachPillars = computed<TitledCard[]>(() =>
    this.content.list<TitledCard>(this.values(), 'approach.pillars', PILLAR_FALLBACK),
  );
  readonly approachCta = computed(() => this.content.text(this.values(), 'approach.cta', 'Speak With Dinq'));

  /* ---- Kairos Alliance ------------------------------------------------------ */
  readonly allianceLogo = computed(() =>
    this.content.text(this.values(), 'alliance.logo', '/media/KAIROS_Logo_White_transparent.png'),
  );
  readonly allianceLabel = computed(() => this.content.text(this.values(), 'alliance.label', 'Strategic Legal Partner'));
  readonly allianceEyebrow = computed(() => this.content.text(this.values(), 'alliance.eyebrow', 'Strategic Alliance'));
  readonly allianceHeading = computed(() =>
    this.content.text(this.values(), 'alliance.heading', 'An Integrated Client Experience'),
  );
  readonly allianceParagraphs = computed<string[]>(() =>
    this.content.list<string>(this.values(), 'alliance.paragraphs', ALLIANCE_FALLBACK),
  );
  readonly allianceBenefitsHeading = computed(() =>
    this.content.text(this.values(), 'alliance.benefitsHeading', 'What This Means for Clients'),
  );
  readonly allianceBenefits = computed<string[]>(() =>
    this.content.list<string>(this.values(), 'alliance.benefits', BENEFIT_FALLBACK),
  );

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
    this.bind('about');
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

const STEP_FALLBACK: TitledCard[] = [
  {
    key: 'assess',
    title: 'Assess',
    text: 'We understand objectives, identify opportunities, evaluate risks, and define a practical roadmap.',
  },
  {
    key: 'advise',
    title: 'Advise',
    text: 'We develop commercially sound strategies supported by local market insight and coordinated legal guidance where required.',
  },
  {
    key: 'implement',
    title: 'Implement',
    text: 'We coordinate stakeholders, engage authorities, manage projects, and support transactions and execution.',
  },
  {
    key: 'support',
    title: 'Support',
    text: 'We remain engaged through ongoing advisory, reporting, governance support, property and asset management, and trusted local representation.',
  },
];

const APPROACH_INTRO_FALLBACK: string[] = [
  'Entering a new market, investing from abroad, or managing assets remotely can require lawyers, consultants, government contacts, technical specialists, property managers, and local representatives. When these parties operate independently, the client is left to coordinate the process.',
  'Dinq is designed to solve that problem. We act as the central advisory and implementation relationship ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â helping clients understand the opportunity, make informed decisions, coordinate the right expertise, execute locally, and remain informed over time.',
];

const PILLAR_FALLBACK: TitledCard[] = [
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

const ALLIANCE_FALLBACK: string[] = [
  'Cross-border business and investment mandates frequently involve both commercial decisions and regulated legal work. Through Dinq\'s strategic collaboration with Kairos Law, clients can receive coordinated advisory, implementation, and legal support without having to manage disconnected workstreams themselves.',
  'Dinq remains the advisory and execution lead. Kairos Law provides Ethiopian legal services where required and within its professional mandate. The two teams coordinate around the client\'s objectives, while maintaining the appropriate professional roles and responsibilities.',
];

const BENEFIT_FALLBACK: string[] = [
  'A coordinated strategy across commercial and legal workstreams.',
  'Fewer disconnected handoffs between advisors.',
  'Clearer implementation sequencing and stakeholder coordination.',
  'Access to legal support when a mandate requires it.',
  'A single client-centred approach focused on practical execution.',
];
