import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { RevealDirective } from '../reveal.directive';
import { ScrollToDirective } from '../scroll-to.directive';
import { IndustriesSectionComponent } from '../industries/industries-section.component';
import { ALL_SECTORS, CORE_INDUSTRIES, IndustryCard, IndustrySector } from '../industries/industries-data';
import { ListItem, PageContentService, PageValues } from '../core/page-content.service';
import { ImageSrcPipe } from '../core/image-src.pipe';

interface PartnerCard {
  title: string;
  text: string;
  icon: string;
  [key: string]: string;
}

interface SolutionCard {
  slug: string;
  title: string;
  text: string;
  [key: string]: string;
}

interface StepCard {
  title: string;
  text: string;
  [key: string]: string;
}

/**
 * Home ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â the entire landing page in one component: hero, what Dinq does, who we
 * help, our solutions, how we work, our approach, core industries, cross-border
 * expertise, the why Ethiopia teaser, Kairos alliance, representative matters,
 * and the closing statement.
 *
 * Copy is read from the `home` page in the CMS and layered over the values below.
 * The values in this file are the shipped copy and the fallback for every key, so
 * the page renders identically whether the API answers, answers with nothing, or
 * is unreachable. Staff edit it under /admin/pages, and a save reaches this tab
 * without a reload.
 *
 * The ids on each <section> element are the anchor targets used by the nav and
 * CTA scroll links. The contact/booking forms live on the dedicated /contact
 * route and are linked from here via the CTAs. The industries block reuses the
 * shared IndustriesSection component (same data + styles as the industry
 * cards elsewhere in the app) and is not editable from the page editor.
 */
@Component({
  selector: 'app-home',
  imports: [RouterLink, RevealDirective, ScrollToDirective, IndustriesSectionComponent, ImageSrcPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly content = inject(PageContentService);

  /** Current page content. Empty until the request resolves, and on any failure. */
  private readonly values = signal<PageValues | null>(null);

  /**
   * Released on destroy, which is what tells PageContentService to stop polling
   * this page ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â without it the timer would outlive the component.
   */
  private watch?: Subscription;

  /* ---- Hero ----------------------------------------------------------------- */
  readonly heroTitle = computed(() => this.content.text(this.values(), 'hero.title', 'Global Perspective.'));
  readonly heroTitleAccent = computed(() => this.content.text(this.values(), 'hero.titleAccent', 'Local Execution.'));
  readonly heroSubhead = computed(() =>
    this.content.text(
      this.values(),
      'hero.subhead',
      'Helping international businesses, investors, institutions, and members of the Ethiopian diaspora establish, grow, manage, and protect their interests in Ethiopia.',
    ),
  );
  readonly heroProof = computed(() =>
    this.content.text(
      this.values(),
      'hero.proof',
      'Whether entering a new market, establishing a business, managing investments, or safeguarding family assets, Dinq provides integrated advisory, implementation support, coordinated legal services, and long-term stewardship through one trusted relationship.',
    ),
  );
  readonly heroCtaPrimary = computed(() => this.content.text(this.values(), 'hero.ctaPrimary', 'Book a Consultation'));
  readonly heroCtaSecondary = computed(() => this.content.text(this.values(), 'hero.ctaSecondary', 'Explore Our Solutions'));
  readonly heroImage = computed(() => this.content.text(this.values(), 'hero.image', '/media/assets/images/hero-addis.jpg'));

  /* ---- What Dinq Does -------------------------------------------------------- */
  readonly whyEyebrow = computed(() => this.content.text(this.values(), 'why.eyebrow', 'What Dinq Does'));
  readonly whyTitle = computed(() =>
    this.content.text(this.values(), 'why.title', 'One relationship, not a patchwork of advisors.'),
  );
  readonly whyBody1 = computed(() =>
    this.content.text(
      this.values(),
      'why.body1',
      'Dinq bridges the gap between international opportunity and successful local execution. We combine strategic advisory with practical implementation, trusted local representation, and ongoing support so clients can move from an idea or investment decision to a well-managed outcome.',
    ),
  );
  readonly whyBody2 = computed(() =>
    this.content.text(
      this.values(),
      'why.body2',
      'Instead of asking clients to coordinate multiple advisors, Dinq provides one integrated relationship across commercial strategy, stakeholder engagement, project coordination, property and asset oversight, and coordinated professional services.',
    ),
  );

  /* ---- Who We Work With ----------------------------------------------------- */
  readonly partnersEyebrow = computed(() => this.content.text(this.values(), 'partners.eyebrow', 'Partnership'));
  readonly partnersTitle = computed(() => this.content.text(this.values(), 'partners.title', 'Who We Help'));
  readonly partners = computed<PartnerCard[]>(() =>
    this.content.list(this.values(), 'partners.items', PARTNER_FALLBACK),
  );

  /* ---- Our Solutions -------------------------------------------------------- */
  readonly solutionsEyebrow = computed(() => this.content.text(this.values(), 'solutions.eyebrow', 'Our Solutions'));
  readonly solutionsTitle = computed(() => this.content.text(this.values(), 'solutions.title', 'How we serve our clients'));
  readonly solutions = computed<SolutionCard[]>(() =>
    this.content.list(this.values(), 'solutions.items', SOLUTION_FALLBACK),
  );

  /* ---- How We Work ---------------------------------------------------------- */
  readonly stepsEyebrow = computed(() => this.content.text(this.values(), 'steps.eyebrow', 'How We Work'));
  readonly steps = computed<StepCard[]>(() => this.content.list(this.values(), 'steps.items', STEP_FALLBACK));

  /* ---- Our Approach --------------------------------------------------------- */
  readonly approachEyebrow = computed(() => this.content.text(this.values(), 'approach.eyebrow', 'Our Approach'));
  readonly approachTitle = computed(() => this.content.text(this.values(), 'approach.title', 'How Dinq works with clients'));
  readonly approachIntro = computed(() =>
    this.content.text(
      this.values(),
      'approach.intro',
      'Advice is only valuable when it can be implemented. Dinq is built around the full client journey: understanding the opportunity, developing the strategy, coordinating the people and institutions required to execute it, and remaining engaged after the initial transaction.',
    ),
  );
  readonly approachItems = computed<string[]>(() =>
    this.content.list<string>(this.values(), 'approach.items', APPROACH_FALLBACK),
  );

  /* ---- Industries -----------------------------------------------------------
      Defined once in industries-data.ts and shared with the industry pages, so it
      is read from that data rather than the page editor. */
  readonly coreIndustries = computed(() =>
    this.content.list<IndustryCard>(this.values(), 'industries.core', CORE_INDUSTRIES),
  );
  readonly additionalSectors = computed(() =>
    this.content.list<IndustrySector>(this.values(), 'industries.sectors', ALL_SECTORS),
  );
  readonly industriesTitle = computed(() => this.content.text(this.values(), 'industries.title', 'Core Industries'));

  /* ---- Cross-Border Expertise ---------------------------------------------- */
  readonly crossBorderEyebrow = computed(() =>
    this.content.text(this.values(), 'crossBorder.eyebrow', 'Cross-Border Expertise'),
  );
  readonly crossBorderBody = computed(() =>
    this.content.text(
      this.values(),
      'crossBorder.body',
      'With a presence in Canada and Ethiopia and relationships across key international markets, Dinq connects global clients with opportunities, expertise, and execution capabilities in Ethiopia. We are particularly positioned to support clients and diaspora communities across Canada, the United States, the United Kingdom, Europe, and the Middle East ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â including existing relationships originating through Kairos Law ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â and we support clients and property owners wherever in the world they are based.',
    ),
  );

  /* ---- Kairos Alliance ------------------------------------------------------ */
  readonly kairosTitle = computed(() =>
    this.content.text(this.values(), 'kairos.title', 'An Integrated Client Experience'),
  );
  readonly kairosBody1 = computed(() =>
    this.content.text(
      this.values(),
      'kairos.body1',
      'Through our strategic collaboration with Kairos Law, clients benefit from coordinated business advisory, implementation support, and legal services where required. Dinq leads the advisory and execution relationship; Kairos Law provides regulated Ethiopian legal services within its areas of practice.',
    ),
  );
  readonly kairosBody2 = computed(() =>
    this.content.text(
      this.values(),
      'kairos.body2',
      'The result is a coordinated client experience rather than a collection of disconnected advisors.',
    ),
  );
  readonly kairosImage = computed(() => this.content.text(this.values(), 'kairos.image', '/media/assets/images/kairos-alliance.jpg'));
  readonly kairosLogo = computed(() =>
    this.content.text(this.values(), 'kairos.logo', '/media/KAIROS_Logo_White_transparent.png'),
  );

  ngOnInit(): void {
    this.watch = this.content.watch('home').subscribe(values => this.values.set(values));
  }

  ngOnDestroy(): void {
    this.watch?.unsubscribe();
  }
}

/* The shipped copy, and the fallback for every key above. Keeping it here means
   the page is complete without the CMS, and the seed in backend/cms matches. */
const PARTNER_FALLBACK: PartnerCard[] = [
  {
    title: 'International Businesses & Investors',
    text: 'Multinationals and mid-market companies entering or expanding operations in Ethiopia.',
    icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-16.5c-1.5 0-3 .6-4.1 1.6M16.1 6.1A8.96 8.96 0 0 1 12 4.5M3.3 9h17.4M3.3 15h17.4M4.9 12.9c2.7 1.2 5.7 1.8 7.1 1.8s4.4-.6 7.1-1.8',
  },
  {
    title: 'Private Equity & Family Offices',
    text: 'Institutional and private capital seeking structured, well-governed exposure to Ethiopian opportunities.',
    icon: 'M2 20V8l5-4 5 4v12M12 20V4l5 4v12M2 20h20M7 12h0M12 12h0M17 12h0',
  },
  {
    title: 'Ethiopian Diaspora',
    text: 'Ethiopians abroad investing, relocating, establishing businesses, or protecting family and property interests back home.',
    icon: 'M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 10v-2a3.5 3.5 0 0 0-2.5-3.3M3 21v-2a3.5 3.5 0 0 1 2.5-3.3',
  },
  {
    title: 'Governments & Development Institutions',
    text: 'Public-sector bodies and agencies delivering investment, infrastructure, and development programs.',
    icon: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6',
  },
  {
    title: 'NGOs & Multilateral Organizations',
    text: 'International organizations coordinating programs, partnerships, and operations on the ground.',
    icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10ZM2 12h20M12 2c2.8 3.1 4.3 7 4.3 10s-1.5 6.9-4.3 10c-2.8-3.1-4.3-7-4.3-10s1.5-6.9 4.3-10Z',
  },
  {
    title: 'Financial Institutions',
    text: 'Banks, lenders, and investors requiring local due diligence, structuring, transaction, or implementation support.',
    icon: 'M2 7h20M2 17h20M6 7v10M10 7v10M14 7v10M18 7v10M2 12h20',
  },
];

const SOLUTION_FALLBACK: SolutionCard[] = [
  {
    slug: 'international-business-investment-advisory',
    title: 'International Business & Investment Advisory',
    text: 'Helping international businesses, investors, and entrepreneurs assess opportunities, enter the Ethiopian market, establish operations, navigate stakeholders and regulations, and move from strategy into implementation.',
  },
  {
    slug: 'diaspora-advisory',
    title: 'Diaspora Advisory',
    text: 'A trusted local point of coordination for diaspora clients managing investments, businesses, real estate, family assets, inheritance and succession matters, relocation, and other interests in Ethiopia.',
  },
  {
    slug: 'property-asset-management',
    title: 'Property & Asset Management',
    text: 'Professional oversight of property and related physical assets in Ethiopia ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â from tenant and rent administration to inspections, maintenance, leasing, vendor coordination, improvements, reporting, and local representation.',
  },
  {
    slug: 'government-institutional-advisory',
    title: 'Government & Institutional Advisory',
    text: 'Supporting businesses, NGOs, development organizations, public institutions, and other stakeholders with government coordination, stakeholder engagement, institutional advisory, investment facilitation, and implementation.',
  },
  {
    slug: 'workforce-organizational-advisory',
    title: 'Workforce & Organizational Advisory',
    text: 'Helping businesses and institutions align organizational structure, workforce capabilities, talent, performance systems, leadership, and HR operations with business strategy and growth.',
  },
];

const STEP_FALLBACK: StepCard[] = [
  {
    title: 'Assess',
    text: 'We begin by understanding your objectives, identifying opportunities, evaluating risks, and defining a practical roadmap.',
  },
  {
    title: 'Advise',
    text: 'We develop commercially sound strategies supported by local market insight and coordinated legal guidance where required.',
  },
  {
    title: 'Implement',
    text: 'We help execute the strategy by coordinating stakeholders, engaging with government authorities, managing projects, and supporting transactions.',
  },
  {
    title: 'Support',
    text: 'Our relationship continues through ongoing advisory, property and asset management, reporting, governance support, and trusted local representation.',
  },
];

const APPROACH_FALLBACK: string[] = [
  'One trusted relationship across strategy, execution, local representation, and ongoing support.',
  'International perspective combined with practical Ethiopian market knowledge.',
  'Execution-focused support rather than strategy alone.',
  'Professional accountability and structured reporting for clients who are not always on the ground.',
  'Coordinated legal support through Kairos Law where regulated legal services are required.',
  'Long-term stewardship of investments, projects, property, and other client interests.',
];
