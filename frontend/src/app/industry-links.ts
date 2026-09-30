/**
 * Reverse cross-links: solution page -> the industries that list that solution.
 *
 * Derived from `INDUSTRY_DETAILS.relatedSolutions` so the two directions can
 * never drift: the industry pages are still the single source of truth, and
 * adding a solution to an industry automatically surfaces that industry on the
 * solution page. Nothing here is hand-maintained.
 */

import { INDUSTRY_DETAILS } from './industries/industries-data';

export interface IndustryLink {
  slug: string;
  title: string;
}

/**
 * Display order: the three core industries first, then the remaining sectors in
 * navigation order. Both sequences are taken from the data modules so a new
 * industry lands in the right place without editing this file.
 */
const CORE_SLUGS = ['real-estate', 'manufacturing', 'mining'];

const SECTOR_SLUGS = [
  'infrastructure',
  'energy',
  'agribusiness',
  'technology-digital-business',
  'healthcare',
  'hospitality-tourism',
  'financial-services',
];

/** Core industries first, then the rest — each group in its declared order. */
const DISPLAY_ORDER: string[] = [...CORE_SLUGS, ...SECTOR_SLUGS];

/** Above this many matches, show only the core industries plus a "view all" pill. */
const COLLAPSE_THRESHOLD = 6;

/**
 * Every industry whose `relatedSolutions` includes `solutionSlug`, ordered
 * core-first. Returns `[]` when nothing matches, so callers can skip rendering
 * the section entirely rather than showing an empty heading.
 */
export function getIndustriesForSolution(solutionSlug: string): IndustryLink[] {
  const matches = Object.values(INDUSTRY_DETAILS)
    .filter((industry) =>
      industry.relatedSolutions?.some((related) => related.slug === solutionSlug),
    )
    .map((industry) => ({ slug: industry.slug, title: industry.title }));

  const position = (slug: string): number => {
    const index = DISPLAY_ORDER.indexOf(slug);
    return index === -1 ? DISPLAY_ORDER.length : index;
  };

  return matches.sort((a, b) => position(a.slug) - position(b.slug));
}

export interface IndustriesForSolution {
  /** Industries to render as pills — already collapsed when there are too many. */
  industries: IndustryLink[];
  /** True when matches were collapsed, so the caller adds a "view all" pill. */
  collapsed: boolean;
}

/**
 * Pill data for the "Industries We Support" section. When a solution covers
 * more than the threshold, only the three core industries are listed and
 * `collapsed` is true so the caller renders the "View all industries" pill.
 */
export function getIndustryPills(solutionSlug: string): IndustriesForSolution {
  const all = getIndustriesForSolution(solutionSlug);

  if (all.length > COLLAPSE_THRESHOLD) {
    return { industries: all.filter((industry) => CORE_SLUGS.includes(industry.slug)), collapsed: true };
  }

  return { industries: all, collapsed: false };
}
