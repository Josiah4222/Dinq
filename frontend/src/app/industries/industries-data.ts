/**
 * Industries content model + data (master doc Section 7).
 *
 * Detail pages are fully data-driven. Core industries are photo cards with
 * hero images and numbered support lists; additional sectors are the lighter
 * tier — text-led with hero images and prose support copy.
 */

export interface IndustryCard {
  index: string;
  title: string;
  text: string;
  image: string;
  alt: string;
  /** Optional route — when absent the card renders as a non-link article. */
  link?: string;
}

export interface IndustrySector {
  title: string;
  /** Optional one-to-two line description shown beneath the title. */
  text?: string;
  /** Optional route — absent when the sector has no dedicated page. */
  link?: string;
}

export interface IndustryDetail {
  slug: string;
  title: string;
  /** One-line positioning statement shown in the hero band. */
  summary: string;
  /** Optional hero image URL displayed in the hero section. */
  heroImage?: string;
  /** Optional lead paragraph under the hero, naming who the sector page serves. */
  lede?: string;
  /** "Opportunity" statement. */
  opportunity: string;
  /** "Typical Client Needs" bullets. */
  clientNeeds: string[];
  /** "How Dinq Supports the Sector" bullets (core industries). */
  support: string[];
  /**
   * "How Dinq Supports the Sector" as running prose (additional sectors).
   * Takes precedence over `support` when present.
   */
  supportCopy?: string;
  /** "Related Solutions" cross-links, by solution slug. */
  relatedSolutions?: RelatedSolution[];
  /** Optional CTA label override. */
  ctaLabel?: string;
}

/** A cross-link from an industry page to a solution page. */
export interface RelatedSolution {
  slug: string;
  title: string;
}

/** The three core industries (photo cards) used by the home page. */
export const CORE_INDUSTRIES: IndustryCard[] = [
  {
    index: '01',
    title: 'Real Estate',
    text: 'Commercial, residential, development, and property-management opportunities for diaspora and international investors.',
    image: '/media/assets/images/industries-realestate.jpg',
    alt: 'Modern high-rise building in Addis Ababa',
    link: '/industries/real-estate',
  },
  {
    index: '02',
    title: 'Manufacturing',
    text: 'Market entry, industrial-park and site strategy, investment structuring, stakeholder coordination, and operational implementation.',
    image: '/media/assets/images/industries-manufacturing.jpg',
    alt: 'Industrial facility with pipes and machinery',
    link: '/industries/manufacturing',
  },
  {
    index: '03',
    title: 'Mining',
    text: 'Market-entry, concession and project strategy, stakeholder engagement, regulatory coordination, and implementation support for specialized mandates.',
    image: '/media/assets/images/industries-mining.jpg',
    alt: 'Aerial view of heavy mining equipment on an open site',
    link: '/industries/mining',
  },
];

/** The additional sectors (lighter tier — each has a page with a hero image). */
export const ALL_SECTORS: IndustrySector[] = [
  {
    title: 'Infrastructure',
    text: 'Advisory and implementation support for developers, investors, and institutions delivering transport, utilities, and public-facing infrastructure projects.',
    link: '/industries/infrastructure',
  },
  {
    title: 'Energy',
    text: 'Market-entry, stakeholder, and regulatory-navigation support for renewable and conventional energy investment.',
    link: '/industries/energy',
  },
  {
    title: 'Agribusiness',
    text: 'Investment structuring, partnership, processing, and export-operation support for agricultural and agribusiness opportunities.',
    link: '/industries/agribusiness',
  },
  {
    title: 'Technology & Digital Business',
    text: 'Entry strategy and regulatory-navigation support for technology companies and digital platforms.',
    link: '/industries/technology-digital-business',
  },
  {
    title: 'Healthcare',
    text: 'Advisory for investors and operators establishing healthcare facilities, services, distribution, or supply chains.',
    link: '/industries/healthcare',
  },
  {
    title: 'Hospitality & Tourism',
    text: 'Market-entry and development support for hotel, tourism, and hospitality investments.',
    link: '/industries/hospitality-tourism',
  },
  {
    title: 'Financial Services',
    text: 'Regulatory, structuring, market-entry, and stakeholder support for banks, insurers, investors, and other financial-services entrants.',
    link: '/industries/financial-services',
  },
];

/** Data for the worked example: Real Estate. */
export const INDUSTRY_DETAILS: Record<string, IndustryDetail> = {
  'real-estate': {
    slug: 'real-estate',
    title: 'Real Estate',
    summary:
      'Dinq advises diaspora clients, investors, developers, businesses, and institutions on real estate opportunities and asset stewardship in Ethiopia.',
    heroImage: '/media/assets/images/industries-realestate.jpg',
    opportunity:
      'Real estate sits at the intersection of investment, development, family wealth, and operating infrastructure. Clients may be acquiring residential or commercial property, evaluating development opportunities, securing premises for a business, monitoring construction, or managing assets from abroad.',
    clientNeeds: [
      'Opportunity and property assessment',
      'Acquisition and transaction coordination',
      'Development and construction oversight',
      'Local partner, broker, vendor, and professional coordination',
      'Property management after acquisition',
      'Family and diaspora asset stewardship',
    ],
    support: [
      'Real estate investment and acquisition advisory',
      'Commercial and residential transaction coordination',
      'Development-project and construction monitoring',
      'Property and asset management',
      'Tenant, maintenance, and vendor coordination',
      'Due diligence and professional-advisor coordination',
      'Local representation and periodic reporting',
    ],
    relatedSolutions: [
      { slug: 'international-business-investment-advisory', title: 'International Business & Investment Advisory' },
      { slug: 'property-asset-management', title: 'Property & Asset Management' },
    ],
  },
  'manufacturing': {
    slug: 'manufacturing',
    title: 'Manufacturing',
    summary:
      'Dinq supports manufacturers and investors evaluating, establishing, or expanding operations in Ethiopia through market-entry, location, stakeholder, workforce, and implementation advisory.',
    heroImage: '/media/assets/images/industries-manufacturing.jpg',
    opportunity:
      'Manufacturing investment requires alignment across market opportunity, investment structure, site selection, industrial infrastructure, import/export considerations, incentives, workforce, and operational execution.',
    clientNeeds: [
      'Market and investment assessment',
      'Industrial-park, site, and location evaluation',
      'Investment and entity-structure coordination',
      'Government and stakeholder engagement',
      'Import/export and operational planning coordination',
      'Workforce planning and recruitment support',
      'Implementation oversight',
    ],
    support: [
      'Market-entry strategy and investment roadmap',
      'Site and industrial-park assessment coordination',
      'Investment incentive and regulatory-navigation support',
      'Stakeholder and government engagement',
      'Project and implementation coordination',
      'Workforce & Organizational Advisory',
      'Ongoing local representation and reporting',
    ],
    relatedSolutions: [
      { slug: 'international-business-investment-advisory', title: 'International Business & Investment Advisory' },
      { slug: 'workforce-organizational-advisory', title: 'Workforce & Organizational Advisory' },
    ],
  },
  'mining': {
    slug: 'mining',
    title: 'Mining',
    summary:
      'Dinq supports specialized mining and natural-resource mandates requiring market-entry strategy, stakeholder coordination, project structuring, and local implementation support.',
    heroImage: '/media/assets/images/industries-mining.jpg',
    opportunity:
      'Mining opportunities can involve long development timelines, multiple public and private stakeholders, technical due diligence, licensing and concession processes, community considerations, and substantial capital commitments.',
    clientNeeds: [
      'Initial market and opportunity assessment',
      'Stakeholder and institutional mapping',
      'Project and investment structuring coordination',
      'Licensing and regulatory-workstream coordination with appropriate specialists',
      'Technical, legal, and commercial advisor coordination',
      'Implementation and local representation',
    ],
    support: [
      'Market-entry and project strategy',
      'Stakeholder and government engagement support',
      'Concession and project-process coordination',
      'Specialist-advisor coordination',
      'Implementation roadmap and workstream management',
      'Local follow-up, monitoring, and reporting',
    ],
    relatedSolutions: [
      { slug: 'international-business-investment-advisory', title: 'International Business & Investment Advisory' },
      { slug: 'government-institutional-advisory', title: 'Government & Institutional Advisory' },
    ],
  },

  // ---------------------------------------------------------------------
  // Additional sectors (client brief, Solutions & Industries).
  // Presentation stays deliberately lighter than the three core industries:
  // prose support copy instead of numbered bullets, with remote stock
  // hero images matching the core-industry hero treatment.
  // ---------------------------------------------------------------------
  infrastructure: {
    slug: 'infrastructure',
    title: 'Infrastructure',
    summary: 'From project opportunity to coordinated local execution.',
    heroImage:
      'https://images.unsplash.com/photo-1758470476440-024d3833b17e?auto=format&fit=crop&w=1200&q=80',
    lede: 'Dinq supports developers, investors, contractors, and institutions pursuing infrastructure opportunities in Ethiopia.',
    opportunity:
      'Infrastructure projects bring together commercial, regulatory, financial, technical, and government considerations. Transport, utilities, urban development, and other major projects often require coordinated local execution across multiple stakeholders and authorities.',
    clientNeeds: [
      'Project and market assessment',
      'Government and stakeholder engagement',
      'Public-private project coordination',
      'Technical, financing, and permitting workstreams',
    ],
    support: [],
    supportCopy:
      'We map key stakeholders, coordinate government engagement, and keep local workstreams moving — bringing in legal, financial, and technical specialists where needed.',
    relatedSolutions: [
      { slug: 'international-business-investment-advisory', title: 'International Business & Investment Advisory' },
      { slug: 'government-institutional-advisory', title: 'Government & Institutional Advisory' },
    ],
  },

  energy: {
    slug: 'energy',
    title: 'Energy',
    summary: 'Navigate the commercial, regulatory, and institutional path to energy investment.',
    heroImage:
      'https://images.unsplash.com/photo-1756913455227-fb3b85575fca?auto=format&fit=crop&w=1200&q=80',
    lede: 'Dinq supports investors, developers, and businesses evaluating renewable and conventional energy opportunities in Ethiopia.',
    opportunity:
      'Energy investment can involve licensing, land, infrastructure, utilities, financing, government institutions, and local stakeholders. Understanding how these elements connect is essential to moving an opportunity toward implementation.',
    clientNeeds: [
      'Market and investment assessment',
      'Licensing, permitting, and land coordination',
      'Government and utility engagement',
      'Project implementation coordination',
    ],
    support: [],
    supportCopy:
      'We help clients assess the opportunity, navigate the institutional environment, and coordinate the local workstreams required to advance a project. Specialist legal, financial, engineering, or environmental advisors can be brought in where needed.',
    relatedSolutions: [
      { slug: 'international-business-investment-advisory', title: 'International Business & Investment Advisory' },
      { slug: 'government-institutional-advisory', title: 'Government & Institutional Advisory' },
    ],
  },

  agribusiness: {
    slug: 'agribusiness',
    title: 'Agribusiness',
    summary: 'Connecting agricultural opportunity with commercial execution.',
    heroImage:
      'https://images.unsplash.com/photo-1746623691157-c4c7a3bad0c4?auto=format&fit=crop&w=1200&q=80',
    lede: 'Dinq supports investors, producers, processors, and exporters pursuing agribusiness opportunities in Ethiopia.',
    opportunity:
      'Agribusiness opportunities span production, processing, value addition, distribution, and export. Execution may depend on land access, partnerships, supply chains, processing capacity, regulatory requirements, and export channels.',
    clientNeeds: [
      'Opportunity and market assessment',
      'Investment, partnership, and land coordination',
      'Processing and operational planning',
      'Regulatory and export coordination',
    ],
    support: [],
    supportCopy:
      'We help clients evaluate opportunities, establish the right local structure, coordinate partners and stakeholders, and move the operational, property, and regulatory workstreams toward implementation.',
    relatedSolutions: [
      { slug: 'international-business-investment-advisory', title: 'International Business & Investment Advisory' },
      { slug: 'property-asset-management', title: 'Property & Asset Management' },
    ],
  },

  'technology-digital-business': {
    slug: 'technology-digital-business',
    title: 'Technology & Digital Business',
    summary: 'Helping technology businesses establish and operate in an evolving market.',
    heroImage:
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80',
    lede: 'Dinq supports technology companies, digital platforms, and technology-enabled businesses evaluating or establishing operations in Ethiopia.',
    opportunity:
      'Technology businesses entering Ethiopia must consider commercial opportunity alongside establishment, licensing, local partnerships, data and platform requirements, and workforce needs.',
    clientNeeds: [
      'Market-entry and opportunity assessment',
      'Business establishment and licensing',
      'Digital-sector regulatory considerations',
      'Local partnerships and workforce setup',
    ],
    support: [],
    supportCopy:
      'We help technology businesses plan market entry, establish local operations, coordinate regulatory requirements, and build the partnerships and workforce needed to operate.',
    relatedSolutions: [
      { slug: 'international-business-investment-advisory', title: 'International Business & Investment Advisory' },
      { slug: 'workforce-organizational-advisory', title: 'Workforce & Organizational Advisory' },
    ],
  },

  healthcare: {
    slug: 'healthcare',
    title: 'Healthcare',
    summary: 'From establishment and regulatory approval to operational readiness.',
    heroImage:
      'https://images.unsplash.com/photo-1764885449332-7eb941d53b7e?auto=format&fit=crop&w=1200&q=80',
    lede: 'Dinq supports investors, healthcare operators, and businesses establishing healthcare facilities, services, and related operations in Ethiopia.',
    opportunity:
      'Healthcare establishment can require corporate setup, business licensing, sector-specific approvals, suitable premises, professional requirements, and operational readiness. Depending on the activity, this may include requirements involving the Ethiopian Food and Drug Authority (EFDA) and other authorities.',
    clientNeeds: [
      'Business establishment and licensing',
      'EFDA and sector-specific regulatory approvals',
      'Premises and facility establishment',
      'Workforce and operational readiness',
    ],
    support: [],
    supportCopy:
      'Dinq coordinates the establishment process from incorporation and licensing through premises, regulatory approvals, and operational setup — bringing together legal, technical, property, and workforce support as required.',
    relatedSolutions: [
      { slug: 'international-business-investment-advisory', title: 'International Business & Investment Advisory' },
      { slug: 'property-asset-management', title: 'Property & Asset Management' },
      { slug: 'workforce-organizational-advisory', title: 'Workforce & Organizational Advisory' },
    ],
  },

  'hospitality-tourism': {
    slug: 'hospitality-tourism',
    title: 'Hospitality & Tourism',
    summary: 'Supporting hospitality investment from site selection to operation.',
    heroImage:
      'https://images.unsplash.com/photo-1551016043-06ec2173531b?auto=format&fit=crop&w=1200&q=80',
    lede: 'Dinq supports investors, developers, and operators pursuing hotel, tourism, and hospitality opportunities in Ethiopia.',
    opportunity:
      'Hospitality investment brings together real estate, development, licensing, operations, workforce, local partnerships, and guest-facing commercial considerations.',
    clientNeeds: [
      'Market and site assessment',
      'Investment and development strategy',
      'Licensing, property, and vendor coordination',
      'Workforce and operational planning',
    ],
    support: [],
    supportCopy:
      'We help clients evaluate opportunities, assess sites, coordinate establishment requirements, and maintain local oversight as projects move from development toward operation.',
    relatedSolutions: [
      { slug: 'international-business-investment-advisory', title: 'International Business & Investment Advisory' },
      { slug: 'property-asset-management', title: 'Property & Asset Management' },
      { slug: 'workforce-organizational-advisory', title: 'Workforce & Organizational Advisory' },
    ],
  },

  'financial-services': {
    slug: 'financial-services',
    title: 'Financial Services',
    summary: 'Local insight for a highly regulated market.',
    heroImage:
      'https://images.unsplash.com/photo-1761233138981-50a88922c852?auto=format&fit=crop&w=1200&q=80',
    lede: 'Dinq supports financial institutions and financial-services businesses evaluating opportunities in Ethiopia.',
    opportunity:
      'Financial services operate within a specialized regulatory and institutional environment. Entrants must understand licensing and establishment requirements alongside capital, operational, workforce, and commercial considerations.',
    clientNeeds: [
      'Market and regulatory assessment',
      'Entry and establishment strategy',
      'Licensing and institutional engagement',
      'Workforce and operational planning',
    ],
    support: [],
    supportCopy:
      'We help clients understand the market and institutional environment, coordinate establishment requirements, engage relevant stakeholders, and manage local implementation. Specialized legal, financial, or regulatory advice is coordinated where required.',
    relatedSolutions: [
      { slug: 'international-business-investment-advisory', title: 'International Business & Investment Advisory' },
      { slug: 'government-institutional-advisory', title: 'Government & Institutional Advisory' },
      { slug: 'workforce-organizational-advisory', title: 'Workforce & Organizational Advisory' },
    ],
  },
};
