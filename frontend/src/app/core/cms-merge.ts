import { ListItem, PageValues } from './page-content.service';

/**
 * Laying CMS values over the copy that ships in the app.
 *
 * The data-driven pages (solutions, industries, insights) already resolve to a
 * complete typed object from a `*-data.ts` file. Rather than rewire each template
 * field by field, a page overlays its stored values onto that object at the one
 * place it assigns it. The static data stays the fallback, so an unreachable API
 * still renders the shipped copy, and a key that is absent keeps the static value.
 *
 * Structure is deliberately not editable: slugs, routes, ordering, and cross
 * links are what make the site navigable, and changing one from a text field
 * would break routing rather than improve the copy. Only content is exposed.
 */

/** A field on the target object and the CMS key that can override it. */
export interface FieldMap<F extends string> {
  /** The property on the resolved page object. */
  field: F;
  /** The CMS block key that overrides it. */
  key: string;
  /** List fields accept either a plain string or an object. */
  list?: boolean;
}

/**
 * Merge one page's stored values onto its static object.
 *
 * Only keys the page actually declared are read, so a stray block left over from
 * an earlier data shape is ignored instead of being splattered onto fields.
 * List fields keep their static value unless the stored one is a real non-empty
 * list, which is what stops an accidental blank from emptying a section.
 */
export function overlay<T extends object>(base: T, values: PageValues | null, map: FieldMap<keyof T & string>[]): T {
  if (!values) {
    return base;
  }
  const merged = { ...base } as Record<string, unknown>;

  for (const { field, key, list } of map) {
    const stored = values[key];
    if (stored === undefined || stored === null) {
      continue;
    }
    if (list) {
      if (Array.isArray(stored) && stored.length) {
        merged[field] = stored;
      }
      continue;
    }
    if (typeof stored === 'string' && stored.trim().length) {
      merged[field] = stored;
    }
  }
  return merged as T;
}

/**
 * Overlay a list of objects, matching stored entries to static ones by their
 * `key` field. Used for repeatables that are edited as a flat list but rendered
 * as records — FAQ entries, leadership rows, engagement cards.
 *
 * Matching by key means an editor can retitle a row and reorder it without the
 * stored list silently becoming a different set of rows.
 */
export function overlayList<T extends object>(
  base: T[],
  values: PageValues | null,
  key: string,
  keyed: (item: T, index: number) => string,
): T[] {
  if (!values) {
    return base;
  }
  const stored = values[key];
  if (!Array.isArray(stored) || !stored.length) {
    return base;
  }

  // Pair each stored entry with the static row it belongs to, where the stored
  // entry names one. An entry that names nothing is new and is appended.
  const byKey = new Map<string, T>();
  base.forEach((item, index) => byKey.set(keyed(item, index), item));

  const out: T[] = [];
  const used = new Set<string>();
  for (const entry of stored) {
    if (!isRecord(entry)) {
      continue;
    }
    const id = typeof entry['key'] === 'string' ? entry['key'] : '';
    const original = id ? byKey.get(id) : undefined;
    if (original) {
      used.add(id);
    }
    out.push({ ...(original ?? {}), ...entry } as T);
  }

  // Static rows the editor did not mention are kept, so removing a row in the
  // editor is the only way to remove it from the page.
  base.forEach((item, index) => {
    const id = keyed(item, index);
    if (!used.has(id)) {
      out.push(item);
    }
  });

  return out;
}

/** Narrow a JSON value to a plain object we can spread. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A repeatable stored as a plain string list, read as an object list. */
export interface TextItem {
  text: string;
}

/** A repeatable stored as text, rendered as records. */
export function asTextItems(value: ListItem[] | undefined): TextItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: TextItem[] = [];
  for (const item of value) {
    const text = typeof item === 'string' ? item : item['text'];
    if (typeof text === 'string' && text.length) {
      out.push({ text });
    }
  }
  return out;
}
