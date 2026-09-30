import { Component, OnInit, computed } from '@angular/core';
import { RevealDirective } from '../reveal.directive';
import { ScrollToDirective } from '../scroll-to.directive';
import { CmsPage } from '../core/cms-page';
import { ImageSrcPipe } from '../core/image-src.pipe';

/**
 * One executive, as the CMS holds them: flat editable fields, so a bio is a
 * single text box and the focus areas are one per line. Both are split back
 * into the paragraphs and pills the template renders.
 */
interface Leader {
  /** Stable row id, so an editor can retitle or reorder without losing the row. */
  key: string;
  name: string;
  role: string;
  /** Headshot path relative to the site root. Empty renders the monogram plate. */
  image: string;
  /** Affiliation shown on the engraved plate beneath the portrait. */
  org: string;
  /** Biography, one paragraph per block, separated by a blank line. */
  bio: string;
  /** Focus areas, one per line. */
  focus: string;
  /**
   * LinkedIn profile URL. Empty until staff paste one, and then the icon is
   * not rendered at all — a leader with no link should show no empty button
   * inviting a click that goes nowhere.
   */
  linkedin: string;
  /**
   * Contact email. Held as a plain address rather than a mailto: link, because
   * that is what a person types into a form field, and the href is built from
   * it when rendered.
   */
  email: string;
  [field: string]: string;
}

/** A blank line between two biography paragraphs. */
const PARAGRAPH_BREAK = /\n\s*\n/;

/** Split a stored bio back into the paragraphs the template renders. */
function bioParagraphs(bio: string): string[] {
  return bio
    .split(PARAGRAPH_BREAK)
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph.length > 0);
}

/** Split a stored focus list back into the pills the template renders. */
function focusAreas(focus: string): string[] {
  return focus
    .split('\n')
    .map(area => area.trim())
    .filter(area => area.length > 0);
}

/** One contact link under a leader's entry. */
interface LeaderLink {
  kind: 'linkedin' | 'email';
  href: string;
  /** Read out instead of the icon, which on its own says nothing. */
  label: string;
}

/** A value carrying a scheme we would put in an href, or null if it is not one. */
function webHref(value: string): string | null {
  const raw = value.trim();
  if (!raw) {
    return null;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
    // http and https are links; mailto, tel, javascript, and data are either
    // the wrong field or not links to offer here at all.
    return /^https?:\/\//i.test(raw) ? raw : null;
  }
  if (raw.includes('@') && !raw.includes('/')) {
    // An address, not a site. Refused here so a mailto: pasted into the
    // LinkedIn field cannot become a link to nowhere.
    return null;
  }
  return raw.startsWith('//') ? `https:${raw}` : `https://${raw}`;
}

/** An email address as a mailto: href, or null if the value is not an address. */
function mailHref(value: string): string | null {
  const raw = value.trim();
  if (!raw) {
    return null;
  }
  if (/^mailto:/i.test(raw)) {
    return raw;
  }
  // A slash means it is a page, not an address, so it does not belong in a
  // mailto: — dropping it is better than sending a visitor's mail client a URL.
  return raw.includes('@') && !raw.includes('/') ? `mailto:${raw}` : null;
}

/**
 * /about/leadership ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Leadership & Team page.
 *
 * Executive biographies below are approved, client-supplied copy. Portraits are
 * supplied for Abel, Habtamu, and Kalkidan; Ida's entry renders as a full-width
 * text dossier until a headshot is added as `image`.
 *
 * Copy is read from the `leadership` page in the CMS and layered over the
 * shipped values below, which are the fallback for every key. Staff edit it
 * under /admin/pages, and a save reaches this tab without a reload. Because the
 * editor handles flat text fields, a biography is stored as one value with its
 * paragraphs separated by blank lines and the focus areas one per line; both are
 * split back apart for rendering.
 *
 * Layout is an alternating editorial dossier: a 4:5 portrait in a padded box
 * with an offset backdrop and an engraved practice plate, set opposite the
 * biography. Biographies open on their first paragraph and expand to the full
 * approved copy on request; the only decoration is a background index numeral.
 */
@Component({
  selector: 'app-leadership',
  imports: [RevealDirective, ScrollToDirective, ImageSrcPipe],
  templateUrl: './leadership.component.html',
  styleUrl: './leadership.component.scss',
})
export class LeadershipComponent extends CmsPage implements OnInit {
  /**
   * Tracks which leaders have their full bio expanded.
   * Using a plain object (not a Set) so Angular change detection
   * picks up mutations and re-evaluates the @if blocks.
   */
  readonly expandedBios: Record<string, boolean> = {};

  /** In-page quick-jump targets. The ids are anchors, so they stay in code. */
  readonly jumpLinks = [
    { id: 'overview', label: 'Overview' },
    { id: 'leadership', label: 'Directors' },
    { id: 'network', label: 'Network' },
  ];

  /* ---- Hero ----------------------------------------------------------------- */
  readonly heroImage = computed(() =>
    this.content.text(this.values(), 'hero.image', '/media/assets/images/hero-addis.jpg'),
  );
  readonly heroEyebrow = computed(() => this.content.text(this.values(), 'hero.eyebrow', 'Our Team'));
  readonly heroTitle = computed(() => this.content.text(this.values(), 'hero.title', 'Leadership'));

  /* ---- Overview ------------------------------------------------------------- */
  readonly introEyebrow = computed(() => this.content.text(this.values(), 'intro.eyebrow', 'Introduction'));
  readonly introHeading = computed(() =>
    this.content.text(
      this.values(),
      'intro.heading',
      'International perspective. Ethiopian expertise. Practical execution.',
    ),
  );
  readonly introParagraphs = computed<string[]>(() =>
    this.content.list<string>(this.values(), 'intro.paragraphs', INTRO_FALLBACK),
  );

  /* ---- Team header ---------------------------------------------------------- */
  readonly teamEyebrow = computed(() => this.content.text(this.values(), 'team.eyebrow', 'The Team'));
  readonly teamHeading = computed(() => this.content.text(this.values(), 'team.heading', 'Meet the leadership'));
  readonly teamMeta = computed(() => this.content.text(this.values(), 'team.meta', 'Leadership Directory'));
  readonly plateLabel = computed(() => this.content.text(this.values(), 'team.plateLabel', 'Practice'));
  readonly focusLabel = computed(() => this.content.text(this.values(), 'team.focusLabel', 'Areas of Focus'));
  readonly expandLabel = computed(() => this.content.text(this.values(), 'team.expandLabel', 'View full bio'));
  readonly collapseLabel = computed(() => this.content.text(this.values(), 'team.collapseLabel', 'Show less'));

  /* ---- Leadership bios ------------------------------------------------------ */
  readonly leaders = computed<Leader[]>(() =>
    this.content.list<Leader>(this.values(), 'leadership.members', LEADER_FALLBACK),
  );

  /* ---- Our Network ---------------------------------------------------------- */
  readonly networkEyebrow = computed(() => this.content.text(this.values(), 'network.eyebrow', 'Our Network'));
  readonly networkHeading = computed(() =>
    this.content.text(this.values(), 'network.heading', 'Coordinated expertise, through one relationship.'),
  );
  readonly networkParagraphs = computed<string[]>(() =>
    this.content.list<string>(this.values(), 'network.paragraphs', NETWORK_FALLBACK),
  );

  /** The paragraphs of a leader's stored biography. */
  paragraphsOf(leader: Leader): string[] {
    return bioParagraphs(leader.bio);
  }

  /** The focus pills of a leader's stored list. */
  focusOf(leader: Leader): string[] {
    return focusAreas(leader.focus);
  }

  /**
   * The links to draw under this leader, in the order they should read.
   *
   * Built here rather than in the template so a blank field simply produces no
   * link, and so the href is finished before it reaches the markup. The icon is
   * meaningless without the name, so each link carries a label naming who it
   * belongs to; a screen reader must not announce "LinkedIn" four times.
   */
  linksOf(leader: Leader): LeaderLink[] {
    const links: LeaderLink[] = [];

    const linkedin = webHref(leader.linkedin ?? '');
    if (linkedin) {
      links.push({ kind: 'linkedin', href: linkedin, label: `${leader.name} on LinkedIn` });
    }

    const email = mailHref(leader.email ?? '');
    if (email) {
      links.push({ kind: 'email', href: email, label: `Email ${leader.name}` });
    }

    return links;
  }

  /** Whether the given leader's remaining paragraphs are on screen. */
  isExpanded(name: string): boolean {
    return !!this.expandedBios[name];
  }

  toggleBio(name: string): void {
    this.expandedBios[name] = !this.expandedBios[name];
  }

  ngOnInit(): void {
    this.bind('leadership');
  }
}

/* The shipped copy, and the fallback for every key above. Keeping it here means
   the page is complete without the CMS, and the seed in backend/cms matches. */
const INTRO_FALLBACK: string[] = [
  'Dinq\'s leadership brings together cross-border business and investment experience with deep expertise in Ethiopia\'s legal, regulatory, tax, institutional, and workforce environment. Our multidisciplinary approach reflects how complex investments and business decisions actually work: commercial strategy, regulation, people, institutions, and implementation are interconnected.',
  'Together, our leadership team helps clients assess opportunities, navigate complexity, establish the right structures, and move from strategy to execution.',
];

const LEADER_FALLBACK: Leader[] = [
  {
    key: 'abel-giratta',
    name: 'Abel Giratta',
    role: 'Founder & Managing Director',
    image: '/media/assets/images/Abel.jpg',
    org: 'Dinq Advisory Group Ãƒâ€šÃ‚Â· Kairos Law',
    bio: `Abel Giratta is the Founder and Managing Director of Dinq Advisory Group, where he leads the firm's cross-border strategy, international business and investment advisory, and growth initiatives. He also serves as Partner & Head of Real Estate and International Advisory at Kairos Law Firm in Addis Ababa, giving him a direct operating role across both the international and Ethiopian sides of Dinq's advisory model.

A Canadian lawyer, entrepreneur, and strategic advisor, Abel brings more than a decade of experience spanning law, real estate, business advisory, and entrepreneurship, complemented by earlier experience in financial services and firsthand field experience in Canada's oil and gas drilling industry across Alberta, Saskatchewan, and Northern Canada. His career has given him experience on both sides of the advisory relationshipÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âas a professional advising clients and as an entrepreneur building and operating businesses.

Called to the Ontario Bar in 2015, Abel later founded Giratta Law Professional Corporation, building and operating a multidisciplinary legal practice serving individuals, entrepreneurs, businesses, and investors across real estate, corporate and commercial, immigration, and cross-border matters. Beyond legal practice, building the firm gave him direct experience in business development, client acquisition, operations, team management, and strategic decision-makingÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âexperience that now informs his approach to advising businesses and investors through Dinq.

Through Dinq, Abel brings these experiences together to help international businesses, investors, institutions, and members of the Ethiopian diaspora establish, invest, operate, and manage interests in Ethiopia. His work spans market-entry strategy, business establishment, investment and real estate advisory, strategic partnerships, stakeholder coordination, and the execution of complex cross-border mandates.

Dividing his time between Canada and Ethiopia, Abel brings an understanding of international professional and commercial expectations together with an increasingly deep knowledge of Ethiopia's business environment and the realities of local execution. His role at Dinq is to bridge those environmentsÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âhelping clients move from opportunity and strategy to implementation and long-term value.`,
    focus: [
      'Cross-Border Strategy',
      'International Business & Investment',
      'Market Entry & Implementation',
      'Real Estate & Asset Advisory',
      'Strategic Partnerships',
      'Diaspora Advisory',
    ].join('\n'),
    linkedin: '',
    email: '',
  },
  {
    key: 'habtamu-bazezew',
    name: 'Habtamu Bazezew',
    role: 'Partner & Legal Strategy Advisor',
    image: '/media/assets/images/habtamu.jpg',
    org: 'Managing Partner, Kairos Law Firm',
    bio: `Habtamu Bazezew is a senior Ethiopian legal practitioner, entrepreneur, and strategic advisor with more than 17 years of experience advising businesses, institutions, NGOs, and individuals on complex legal, regulatory, employment, and commercial matters.

He is the founder of the legal practice that evolved into Kairos Law Firm, where he now serves as Managing Partner. Over nearly two decades of independent practice, Habtamu has developed substantial experience in employment and labour matters, commercial disputes and litigation, NGO and institutional advisory, construction and infrastructure matters, and regulatory compliance. His work includes advising employers and organizations on workplace disputes, employment risk, organizational policies and compliance, as well as representing clients in significant commercial disputes and litigation.

A significant part of Habtamu's practice has involved advising international and local NGOs and institutions operating in Ethiopia, including establishment and registration, regulatory compliance, employment, governance, and ongoing operational legal requirements. This work has given him extensive experience navigating Ethiopia's legal and institutional environment and engaging with government bodies, regulators, businesses, and other stakeholders.

At Dinq, Habtamu brings this legal and institutional perspective to investment, market-entry, organizational, and institutional mandates. He contributes particularly to Dinq's International Business & Investment, Workforce & Organizational, and Government & Institutional Advisory practices, helping clients integrate legal and regulatory considerations into broader commercial and implementation strategies.

Habtamu also serves as the strategic bridge between Dinq and Kairos Law. Where regulated Ethiopian legal services are required, they are provided separately through Kairos, allowing clients to benefit from coordinated advisory, implementation, and legal support while maintaining the appropriate distinction between Dinq's advisory role and legal representation.`,
    focus: [
      'Legal Strategy',
      'Employment & Labour',
      'NGO & Institutional Advisory',
      'Commercial Disputes & Litigation',
      'Regulatory Matters',
      'Construction & Infrastructure',
    ].join('\n'),
    linkedin: '',
    email: '',
  },
  {
    key: 'ida-edo',
    name: 'Ida Edo',
    role: 'Director, Workforce & Organizational Advisory',
    image: '',
    org: 'Workforce & Organizational Advisory',
    bio: `Ida Edo is a senior human resources and organizational advisory professional with more than 10 years of experience helping organizations strengthen their workforce, talent practices, and people operations. Her experience spans workforce planning, talent management, recruitment, employee relations, performance management, organizational change, and HR operations.

Her career includes roles with Shopify, the University of Toronto, Tata, and Aon Hewitt. At Shopify, Ida partnered with leaders and HR teams on talent and performance management, employee engagement, leadership development, organizational change, workforce planning, and operational improvement. At the University of Toronto, she advised approximately 40 client groups on recruitment and workforce planning and supported the implementation of HR systems.

At Dinq, Ida leads the Workforce & Organizational Advisory practice, helping businesses and institutions align their people, organizational structures, and workforce capabilities with broader business strategy. She works with organizations entering, expanding, restructuring, or strengthening operations in Ethiopia, with a focus on building the organizational capacity and people systems required for effective execution and sustainable growth.

Ida is a Certified Human Resources Professional and has completed the HRPA Employment Law examination.`,
    focus: [
      'Workforce Strategy',
      'Organizational Effectiveness',
      'Talent Management',
      'HR Transformation',
      'Performance & Leadership Development',
    ].join('\n'),
    linkedin: '',
    email: '',
  },
  {
    key: 'kalkidan-hailemariam',
    name: 'Kalkidan Hailemariam',
    role: 'Senior Advisor, Tax, Customs & Regulatory Affairs',
    image: '/media/assets/images/Kalkidan H.jpg',
    org: 'Dinq Advisory Group',
    bio: `Kalkidan Hailemariam is a senior legal and regulatory advisor with extensive experience across Ethiopia's tax, customs, regulatory, and public-sector environment. Her career spans senior roles within the Ethiopian Revenues and Customs Authority, the Federal Attorney General's Office, and leading private-sector organizations.

At the Ethiopian Revenues and Customs Authority, Kalkidan advised on tax law, handled tax disputes, and held responsibilities in customs enforcement. This experience gave her firsthand insight into how Ethiopia's tax and customs framework is interpreted, administered, and enforcedÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âan institutional perspective that complements her subsequent work advising businesses and organizations.

Her broader experience across government and the private sector enables her to approach regulatory matters from both institutional and commercial perspectives. She brings particular expertise in taxation, customs, regulatory compliance, dispute management, and engagement with government institutions.

At Dinq, Kalkidan supports international businesses, investors, and institutions navigating the tax, customs, and regulatory dimensions of entering and operating in Ethiopia. She contributes particularly to market-entry and investment mandates where understanding regulatory requirements, institutional processes, and potential compliance risks is critical to successful execution.`,
    focus: [
      'Tax & Customs',
      'Regulatory Advisory',
      'Tax Disputes',
      'Investment & Market Entry',
      'Government & Institutional Engagement',
    ].join('\n'),
    linkedin: '',
    email: '',
  },
];

const NETWORK_FALLBACK: string[] = [
  'No single discipline can address every aspect of a complex investment or cross-border mandate. Dinq coordinates legal, financial, technical, sector, and operational expertise according to the needs of each engagement. This allows clients to work through a central advisory relationship while drawing on specialized support when required.',
];
