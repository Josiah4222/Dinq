/**
 * Insights content model + the article registry (master doc Section 10).
 *
 * ---------------------------------------------------------------------------
 * CMS INTEGRATION POINT (Section 1: insights articles are CMS-driven)
 * ---------------------------------------------------------------------------
 * The templates in this folder are 100% data-driven and never hardcode article
 * content. An article's copy lives in the CMS as its own page (`insight-<slug>`)
 * with one block per field, and the components lay those values over this
 * registry. So this file holds structure only — which articles exist, their
 * order, and their related links — and no prose.
 *
 *   - `getArticles()`  → the listing, sorted for the index grid.
 *   - `getArticle(slug)` → single article by slug.
 *   - `getRelated(article)` → resolves `relatedSlugs` against the registry.
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
 * The published articles, newest first.
 *
 * Empty for now: the three launch placeholders were withdrawn. Publishing an
 * article is a CMS action — create its `insight-<slug>` page and blocks, then
 * add an entry here so the index and the article template can resolve the slug.
 * Copy never goes in this file.
 */
export const INSIGHTS: InsightArticle[] = [];

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
