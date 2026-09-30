/**
 * Solutions content model + data (master doc Section 6).
 *
 * The detail pages are fully data-driven: adding one of the remaining four
 * solutions later means adding an entry to `SOLUTION_DETAILS` — no component
 * or template changes required. FAQ and related solutions are optional.
 */

export interface SolutionFaq {
  q: string;
  a: string;
}

export interface SolutionRelated {
  slug: string;
  title: string;
}

export interface SolutionCard {
  slug: string;
  index: string;
  title: string;
  text: string;
}

export interface SolutionDetail {
  slug: string;
  title: string;
  /** One-line summary shown in the hero band. */
  summary: string;
  /** Optional supporting subheading shown under the page title. */
  headline?: string;
  /** Optional italic supporting tagline shown beneath the hero summary. */
  tagline?: string;
  /** Optional hero image URL displayed in the hero section. */
  heroImage?: string;
  /** "The Opportunity" statement. */
  opportunity: string;
  /** "Common Challenges" bullets. */
  challenges: string[];
  /** "Our Approach" statement. */
  approach: string;
  /** "How Dinq can help" bullets. */
  delivery: string[];
  /** Optional override for the services-list heading. */
  deliveryHeading?: string;
  /** Optional closing paragraph shown after the services list. */
  closing?: string;
  /** "Why Dinq" statement. */
  whyDinq: string;
  /** Optional FAQ — the accordion only renders when present. */
  faq?: SolutionFaq[];
  /** Optional related-solutions cards. */
  related?: SolutionRelated[];
  /** Optional override for the bottom CTA button label. */
  ctaLabel?: string;
}

/** The five practice areas shown on the /solutions index grid. */
export const SOLUTION_CARDS: SolutionCard[] = [
  {
    slug: 'international-business-investment-advisory',
    index: '01',
    title: 'International Business & Investment Advisory',
    text: 'Helping international businesses, investors, and entrepreneurs assess opportunities, enter the Ethiopian market, establish operations, navigate stakeholders and regulations, and move from strategy into implementation.',
  },
  {
    slug: 'diaspora-advisory',
    index: '02',
    title: 'Diaspora Advisory',
    text: 'A trusted local point of coordination for diaspora clients managing investments, businesses, real estate, family assets, inheritance and succession matters, relocation, and other interests in Ethiopia.',
  },
  {
    slug: 'property-asset-management',
    index: '03',
    title: 'Property & Asset Management',
    text: 'Professional oversight of property and related physical assets in Ethiopia — from tenant and rent administration to inspections, maintenance, leasing, vendor coordination, improvements, reporting, and local representation.',
  },
  {
    slug: 'government-institutional-advisory',
    index: '04',
    title: 'Government & Institutional Advisory',
    text: 'Supporting businesses, NGOs, development organizations, public institutions, and other stakeholders with government coordination, stakeholder engagement, institutional advisory, investment facilitation, and implementation.',
  },
  {
    slug: 'workforce-organizational-advisory',
    index: '05',
    title: 'Workforce & Organizational Advisory',
    text: 'Helping businesses and institutions align organizational structure, workforce capabilities, talent, performance systems, leadership, and HR operations with business strategy and growth.',
  },
];

/** Data for the worked example: Property & Asset Management. */
export const SOLUTION_DETAILS: Record<string, SolutionDetail> = {
  'property-asset-management': {
    slug: 'property-asset-management',
    title: 'Property & Asset Management',
    headline: 'Professional oversight. Trusted local execution.',
    summary:
      'Dinq provides ongoing property and asset management for clients who need reliable professional oversight in Ethiopia, particularly owners living abroad. We act as a trusted local point of coordination — protecting, maintaining, and managing property interests while keeping clients informed wherever they are.',
    heroImage:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    opportunity:
      'Owning property or business assets in Ethiopia while living or operating abroad creates real value — and real distance. Clients need a partner who treats their assets with the same care they would themselves.',
    challenges: [
      'Distance and limited visibility into the condition of the property.',
      'Tenant communication, rent monitoring, and issue resolution.',
      'Maintenance, repair, and vendor management.',
      'Renovation or construction work that requires local monitoring.',
      'Lack of reliable documentation and periodic reporting.',
      'Family or inherited assets with unclear management responsibilities.',
    ],
    approach:
      'We act as your on-the-ground representative — inspecting properties, coordinating tenants and vendors, overseeing construction, and reporting back with full transparency.',
    deliveryHeading: 'Services May Include',
    delivery: [
      'Tenant communication and management',
      'Rent administration and financial reporting',
      'Property inspections and condition reporting',
      'Maintenance, repair, and vendor coordination',
      'Leasing, renewals, move-outs, and tenant onboarding',
      'Renovation and improvement oversight',
      'Construction and project monitoring',
      'Ongoing asset monitoring and local representation',
      'Coordination of legal, tax, succession, or other professional support where required',
    ],
    closing:
      'Where a property matter intersects with investment, corporate structuring, succession, tax, or legal requirements, Dinq coordinates the appropriate professionals while remaining the client\'s central point of oversight.',
    whyDinq:
      'Property management is not simply about collecting rent or arranging repairs. Dinq\'s model emphasizes stewardship, documentation, accountability, and communication — particularly for owners who are outside Ethiopia.',
    faq: [
      {
        q: 'How often will I receive updates on my property?',
        a: 'Clients receive monthly reports covering property condition, tenant status, income, and expenses, with additional updates whenever something requires your attention.',
      },
      {
        q: 'What happens if a tenant stops paying or causes damage?',
        a: 'We manage the issue directly — from formal notices through to resolution, in coordination with legal counsel where necessary — and keep you informed at every step.',
      },
      {
        q: 'Can I manage everything remotely from abroad?',
        a: 'Yes. Our reporting and communication are designed for clients who are not physically present in Ethiopia, with regular check-ins by phone, email, or video call.',
      },
      {
        q: 'What are your management fees, and what do they cover?',
        a: 'Fees are structured around the scope of work — routine management, active renovation oversight, or full asset stewardship — and are discussed transparently before engagement begins.',
      },
      {
        q: 'Do you handle renovations or construction oversight?',
        a: 'Yes. We coordinate contractors, monitor progress and budget, and report on milestones so you have full visibility into any renovation or build.',
      },
      {
        q: 'What happens if I want to sell the property later?',
        a: 'We support the sale process end-to-end, including coordinating with brokers, buyers, and appropriate professionals through to closing.',
      },
    ],
    related: [
      { slug: 'diaspora-advisory', title: 'Diaspora Advisory' },
      { slug: 'international-business-investment-advisory', title: 'International Business & Investment Advisory' },
    ],
    ctaLabel: 'Discuss Your Property or Assets',
  },
  'international-business-investment-advisory': {
    slug: 'international-business-investment-advisory',
    title: 'International Business & Investment Advisory',
    summary:
      'Helping organizations assess opportunities, enter the Ethiopian market, structure investments, coordinate stakeholders, and execute with confidence.',
    tagline: 'Connecting Opportunity Across Borders.',
    heroImage:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    opportunity:
      'Ethiopia can offer significant opportunities, but successful entry requires more than identifying a promising sector. Investors must understand the market, choose an appropriate structure, assess local partners and locations, navigate institutions, coordinate professional advisors, and manage implementation.',
    challenges: [
      'Limited reliable market intelligence or fragmented information.',
      'Uncertainty about market-entry structures, local partners, and implementation sequence.',
      'Navigating government institutions, permits, incentives, and stakeholder relationships.',
      'Coordinating legal, financial, technical, and operational advisors.',
      'Managing a project from abroad without reliable local oversight.',
    ],
    approach:
      'We begin with the commercial objective, not a predetermined structure. Dinq assesses the opportunity and execution environment, develops a practical roadmap, coordinates the required stakeholders and professional disciplines, and remains involved as the strategy moves into implementation.',
    delivery: [
      'Market-entry and investment strategy.',
      'Opportunity assessment and commercial due diligence coordination.',
      'Investment and corporate-structure planning with coordinated legal support where required.',
      'Local partner and stakeholder identification and coordination.',
      'Government and institutional engagement support.',
      'Site, industrial-park, and location assessment coordination.',
      'Investment incentive and regulatory-navigation support.',
      'Transaction and project coordination.',
      'Implementation planning and local representation.',
      'Ongoing advisory, monitoring, and reporting.',
    ],
    whyDinq:
      'Dinq combines international client expectations with local execution capability. The value is not simply knowing what should be done, but helping coordinate how it gets done.',
    related: [
      { slug: 'government-institutional-advisory', title: 'Government & Institutional Advisory' },
      { slug: 'workforce-organizational-advisory', title: 'Workforce & Organizational Advisory' },
      { slug: 'property-asset-management', title: 'Property & Asset Management' },
    ],
  },
  'diaspora-advisory': {
    slug: 'diaspora-advisory',
    title: 'Diaspora Advisory',
    summary:
      'Helping Ethiopians abroad invest, relocate, establish businesses, manage family interests, and navigate matters in Ethiopia through trusted local representation.',
    tagline: 'Connecting Opportunity Across Borders.',
    heroImage:
      'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80',
    opportunity:
      'For diaspora clients, the challenge is often not willingness to invest or engage with Ethiopia; it is distance, fragmented information, informal processes, and the difficulty of finding a reliable professional team that can represent their interests on the ground.',
    challenges: [
      'Managing important matters from Canada, the United States, the United Kingdom, Europe, or the Middle East.',
      'Relying on relatives or informal contacts for transactions requiring professional oversight.',
      'Difficulty verifying property, business, or investment information.',
      'Coordinating multiple professionals and government offices remotely.',
      'Monitoring construction, tenants, maintenance, or investments from abroad.',
      'Handling family, inheritance, or property issues that require local coordination.',
    ],
    approach:
      'Dinq becomes the client\'s professional point of coordination in Ethiopia. We define the objective, identify risks, establish clear responsibilities and reporting, coordinate required specialists, and keep the client informed throughout execution.',
    delivery: [
      'Investment and business-establishment advisory.',
      'Property acquisition and transaction coordination.',
      'Property and asset management.',
      'Tenant, maintenance, and vendor coordination.',
      'Construction and renovation monitoring.',
      'Local due diligence and document-verification coordination.',
      'Family property and estate-related coordination, with legal matters referred to appropriate counsel.',
      'Trusted local representation and stakeholder follow-up.',
      'Periodic reporting, photographs, updates, and issue escalation.',
      'Relocation and re-establishment coordination where appropriate.',
    ],
    whyDinq:
      'For diaspora clients, Dinq offers something fundamentally different from informal help: structured professional oversight. Our role is to be a reliable set of eyes and ears on the ground while the client retains visibility and control.',
    related: [
      { slug: 'property-asset-management', title: 'Property & Asset Management' },
      { slug: 'international-business-investment-advisory', title: 'International Business & Investment Advisory' },
    ],
  },
  'government-institutional-advisory': {
    slug: 'government-institutional-advisory',
    title: 'Government & Institutional Advisory',
    summary:
      'Strategic advisory, stakeholder engagement, program coordination, and implementation support for governments, development agencies, NGOs, and institutional investors.',
    heroImage:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    opportunity:
      'Complex institutional mandates often involve multiple stakeholders, regulatory bodies, private-sector partners, technical experts, and implementation teams. The challenge is aligning these parties around a clear strategy and maintaining momentum from concept through delivery.',
    challenges: [
      'Fragmented stakeholder interests and decision-making structures.',
      'Need for local institutional knowledge and relationship management.',
      'Coordination between international and Ethiopian teams.',
      'Project implementation across legal, commercial, technical, and operational workstreams.',
      'Need for reliable local follow-up, reporting, and issue escalation.',
    ],
    approach:
      'Dinq works as a coordinating advisory layer: clarifying objectives, mapping stakeholders, establishing an implementation roadmap, supporting engagement, and maintaining follow-through across workstreams.',
    delivery: [
      'Strategic and project advisory.',
      'Stakeholder mapping and engagement support.',
      'Public-private coordination.',
      'Institutional and government liaison support.',
      'Program and project implementation coordination.',
      'Local partner and service-provider coordination.',
      'Meeting, workstream, and action-item management.',
      'Research and briefing support.',
      'Implementation monitoring and reporting.',
      'Coordination of legal and specialized professional support where required.',
    ],
    whyDinq:
      'Our value lies in connecting strategy, relationships, and execution. We help international and local stakeholders work through one coordinated implementation framework.',
    related: [
      { slug: 'international-business-investment-advisory', title: 'International Business & Investment Advisory' },
      { slug: 'workforce-organizational-advisory', title: 'Workforce & Organizational Advisory' },
    ],
  },
  'workforce-organizational-advisory': {
    slug: 'workforce-organizational-advisory',
    title: 'Workforce & Organizational Advisory',
    summary:
      'Organization and workforce strategy, talent and leadership, HR transformation, change, and employment-risk coordination aligned with business and implementation needs.',
    heroImage:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    opportunity:
      'Market entry, expansion, restructuring, and project delivery all depend on having the right organization and workforce. Businesses may need to build teams quickly, redesign roles, establish practical HR systems, or develop sector-specific operational capability.',
    challenges: [
      'Building a local team during market entry or expansion.',
      'Unclear organizational structures, roles, or accountability.',
      'Workforce planning for new projects or facilities.',
      'Recruitment and talent-identification needs.',
      'HR processes that do not support operational goals.',
      'Need for practical, sector-relevant workforce and operational training.',
    ],
    approach:
      'Dinq begins with the business strategy and translates it into the organization, workforce, leadership, and people systems required for execution. We integrate workforce considerations into market entry, expansion, restructuring, and institutional mandates rather than treating HR as a stand-alone administrative exercise.',
    delivery: [
      'Organization & Workforce Strategy — workforce planning, organizational design, operating models, role and accountability design, restructuring, and change management.',
      'Talent & Leadership — talent strategy, executive and specialized recruitment support, succession planning, leadership development, performance management, and employee engagement.',
      'HR Transformation & Operations — HR operating models, process improvement, HR systems implementation support, policies, people analytics, and HR service delivery.',
      'Employment & Workplace Advisory — employee relations, workplace policies, performance and disciplinary process support, employment-risk coordination, and coordinated Ethiopian employment-law advice through Kairos Law where regulated legal advice is required.',
      'Leadership, management, and workforce capability development.',
      'Coordination of specialized third-party training providers where sector-specific or technical training is required.',
      'Cross-border workforce integration and implementation support for market-entry, expansion, restructuring, and institutional mandates.',
      'Workforce implementation, monitoring, and reporting aligned with the broader Dinq engagement.',
    ],
    whyDinq:
      'Workforce strategy is part of execution. Dinq combines senior organizational and talent-management capability with its broader investment and implementation platform. Through strategic collaboration with Kairos Law, clients can also coordinate Ethiopian employment-law and workplace legal matters where regulated legal services are required. This creates a connected path from business strategy to organization design, workforce implementation, employment-risk management, and ongoing support.',
    related: [
      { slug: 'international-business-investment-advisory', title: 'International Business & Investment Advisory' },
      { slug: 'government-institutional-advisory', title: 'Government & Institutional Advisory' },
    ],
  },
};
