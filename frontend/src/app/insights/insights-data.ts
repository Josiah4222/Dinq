/**
 * Insights content model + seed data (master doc Section 10).
 *
 * ---------------------------------------------------------------------------
 * CMS INTEGRATION POINT (Section 1: insights articles are CMS-driven)
 * ---------------------------------------------------------------------------
 * The templates in this folder are 100% data-driven and never hardcode article
 * content. Right now articles resolve from the local `INSIGHTS` array below —
 * the single place to swap this for the planned headless CMS / markdown
 * source. Suggested integration (not yet decided):
 *
 *   - `getArticles()`  → replace body with a fetch to the CMS collection
 *                        (e.g. Contentful/Sanity REST/GraphQL, or a static
 *                        markdown import), mapping to `InsightArticle`.
 *   - `getArticle(slug)` → same, single-item fetch.
 *   - `getRelated(slug)` → resolve `relatedSlugs` against the collection.
 *
 * Nothing else in the app needs to change when that lands.
 * ---------------------------------------------------------------------------
 */

export interface InsightArticle {
  slug: string;
  title: string;
  /** Author byline shown in the article header. */
  author: string;
  /** ISO date string, e.g. '2026-08-01'. */
  date: string;
  /** Featured image path — may be empty until artwork exists. */
  featuredImage?: string;
  /** Short category label used for the index filter chip. */
  category: string;
  /** One-line summary for the index grid card. */
  summary: string;
  /** Body copy rendered as paragraphs on the article page. */
  body: string[];
  /** Slugs of articles to surface in the related-articles module. */
  relatedSlugs: string[];
}

/**
 * Seed articles at launch (titles/copy are placeholders from the brand
 * strategy — final editorial copy to be supplied via CMS).
 */
export const INSIGHTS: InsightArticle[] = [
  {
    slug: '5-mistakes-foreign-investors-making-entering-ethiopia',
    title: '5 Mistakes Foreign Investors Make Entering Ethiopia',
    author: 'Dinq Advisory Group',
    date: '2026-07-01',
    category: 'Investor Guide',
    featuredImage: '/media/assets/images/hero-addis.jpg',
    summary:
      'Common pitfalls we see when international investors enter the Ethiopian market — and how to avoid them.',
    body: [
      'Entering a new market is as much about what you avoid as what you do. In our work with international investors in Ethiopia, a handful of mistakes recur often enough to be predictable.',
      'First, underestimating lead time. Registration, licensing, and operational setup almost always take longer than first estimates, so planning for the real timeline protects budgets and investor confidence.',
      'Second, skipping local due diligence. Assumptions that work in home markets — about land, counterparties, and regulatory practice — need to be re-validated on the ground in Ethiopia.',
      'Third, ignoring the sequencing of approvals. Some permits must precede others, and getting the order wrong can delay an entire project by months.',
      'Fourth, treating compliance as an afterthought. Tax, reporting, and corporate obligations accumulate quickly; addressing them early avoids penalties and distractions later.',
      'Fifth, working without a coordinated local partner. Fragmented advice across multiple disconnected advisors creates exactly the kind of risk that a single integrated relationship is designed to prevent.',
      'The pattern behind these mistakes is consistent: distance amplifies small errors. A structured entry plan, coordinated through one trusted partner, is the most reliable countermeasure.',
    ],
    relatedSlugs: ['a-diaspora-guide-to-investing-back-home'],
  },
  {
    slug: 'a-diaspora-guide-to-investing-back-home',
    title: 'A Diaspora Guide to Investing Back Home',
    author: 'Dinq Advisory Group',
    date: '2026-06-12',
    category: 'Diaspora',
    featuredImage: '/media/assets/images/industries-realestate.jpg',
    summary:
      'Practical guidance for Ethiopians abroad investing, relocating, or protecting family assets back home.',
    body: [
      'For Ethiopians abroad, investing back home is as much an emotional decision as a financial one. Done well, it creates family security and lasting value; done hastily, it can create friction and regret.',
      'The first decision is structural: whether to invest as a non-resident directly, through a local entity, or in partnership with family already in Ethiopia. Each option has different implications for ownership, tax, and management.',
      'Land and property deserve special care. Understanding lease structures, title verification, and the due-diligence that should precede any acquisition will protect the investment from disputes later.',
      'Repatriation matters too. Returns need to flow home again, so the tax treatment of dividends and proceeds, and the practical mechanics of moving money, should be settled before capital is committed.',
      'Finally, stewardship. Many diaspora investors cannot be physically present, which makes trusted local management the difference between an asset that is protected and one that slowly erodes.',
      'A coordinated approach — combining commercial advisory with legal support — gives diaspora families a single relationship that covers investment, operation, and long-term protection of what matters most.',
    ],
    relatedSlugs: ['5-mistakes-foreign-investors-making-entering-ethiopia'],
  },
  {
    slug: 'manufacturing-opportunities-in-ethiopia',
    title: 'Manufacturing Opportunities in Ethiopia: What Investors Should Know',
    author: 'Dinq Advisory Group',
    date: '2026-05-20',
    category: 'Sector Guide',
    featuredImage: '/media/assets/images/industries-manufacturing.jpg',
    summary:
      'What foreign manufacturers need to know about industrial parks, incentives, and operating in Ethiopia.',
    body: [
      'Ethiopia\u2019s manufacturing sector sits at the centre of its industrial strategy, anchored by a network of industrial parks and a policy framework designed to attract export-oriented production.',
      'Industrial parks offer investors built infrastructure and streamlined administration, including utility connections, customs services, and incentives administered through a single point of contact.',
      'Sector focus areas include textiles and apparel, leather and footwear, agro-processing, and a growing set of light-manufacturing and assembly industries. Export orientation is a recurring theme in incentive eligibility.',
      'The practical questions investors face are familiar: land allocation within parks, workforce availability and training, logistics to ports, and the sequencing of construction and commissioning against incentive timelines.',
      'Import/export structuring matters as much as factory operations. Duty regimes, raw-material import rules, and the documentation required to stay compliant all shape the unit economics of a manufacturing investment.',
      'For manufacturers, the winning approach is to plan the operational chain — from incentive application through construction to first export — as one integrated programme, coordinated by a partner who understands the whole picture.',
    ],
    relatedSlugs: ['a-diaspora-guide-to-investing-back-home'],
  },
];

/** Reverse-chronological listing for the /insights index grid. */
export function getArticles(): InsightArticle[] {
  return [...INSIGHTS].sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Single article by slug, or undefined for unknown slugs. */
export function getArticle(slug: string): InsightArticle | undefined {
  return INSIGHTS.find((article) => article.slug === slug);
}

/** Resolves relatedSlugs to full articles (missing entries are skipped). */
export function getRelated(article: InsightArticle): InsightArticle[] {
  return article.relatedSlugs
    .map((slug) => getArticle(slug))
    .filter((related): related is InsightArticle => Boolean(related));
}
