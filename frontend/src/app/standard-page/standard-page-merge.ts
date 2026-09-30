import { PageValues } from '../core/page-content.service';
import { overlayList } from '../core/cms-merge';
import { StandardPageHero, StandardPageSection } from './standard-page.component';

/**
 * Laying CMS values over a Standard Content Page's route data.
 *
 * The four pages using this template keep their copy in route `data` in
 * app.routes.ts, which stays the fallback and the source of structure. The block
 * keys are built from the section `id`, so `sections.tax-corporate.heading`
 * addresses that section's heading, and the id also keeps the anchor links
 * working: renaming a heading cannot break `#tax-corporate`.
 *
 * Layout is not editable. `kind`, `tone`, `align` and `pending` decide how a
 * section is drawn, and a section's existence is the page's shape, so those
 * stay in the route. Only words an editor would recognise as copy are exposed.
 */

/** Fields copied straight across for a section, keyed by block-key suffix. */
const SECTION_FIELDS: (keyof StandardPageSection & string)[] = [
  'eyebrow',
  'heading',
  'text',
  'amharic',
];

const HERO_FIELDS: (keyof StandardPageHero & string)[] = ['eyebrow', 'title', 'lead', 'image'];

/** Keep a stored value only if it is a real string, else fall back. */
function pick(values: PageValues | null, key: string, fallback: string | undefined): string | undefined {
  const stored = values?.[key];
  return typeof stored === 'string' && stored.trim().length ? stored : fallback;
}

/** Keep a stored list only if it is a real non-empty array. */
function pickList(values: PageValues | null, key: string, fallback: string[] | undefined): string[] | undefined {
  const stored = values?.[key];
  return Array.isArray(stored) && stored.length ? (stored as string[]) : fallback;
}

export function overlayHero(base: StandardPageHero, values: PageValues | null): StandardPageHero {
  const hero: StandardPageHero = { ...base };
  for (const field of HERO_FIELDS) {
    const next = pick(values, `hero.${field}`, base[field] as string | undefined);
    if (next !== undefined) {
      (hero as unknown as Record<string, unknown>)[field] = next;
    }
  }
  return hero;
}

export function overlaySection(base: StandardPageSection, values: PageValues | null): StandardPageSection {
  const id = base.id ?? '';
  const at = `sections.${id}`;
  const section: StandardPageSection = { ...base };

  for (const field of SECTION_FIELDS) {
    const next = pick(values, `${at}.${field}`, base[field] as string | undefined);
    if (next !== undefined) {
      (section as unknown as Record<string, unknown>)[field] = next;
    }
  }

  const paragraphs = pickList(values, `${at}.paragraphs`, base.paragraphs);
  if (paragraphs) {
    section.paragraphs = paragraphs;
  }

  if (base.items?.length) {
    // Rows are keyed by position, so the key cannot drift. Ordering still comes
    // from the stored list, which is what lets a reorder in the editor show up.
    section.items = overlayList(
      base.items,
      values,
      `${at}.items`,
      (_item, index) => String(index),
    );
  }

  return section;
}

export function overlaySections(
  base: StandardPageSection[],
  values: PageValues | null,
): StandardPageSection[] {
  if (!values) {
    return base;
  }
  return base.map(section => overlaySection(section, values));
}
