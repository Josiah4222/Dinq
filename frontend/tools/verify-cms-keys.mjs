/**
 * Check that the CMS copy and the Angular source of truth agree, in both
 * directions, for the pages that are generated from `*-data.ts`.
 *
 * This is the check that catches the failure the migration exists to prevent: a
 * block visible in the editor that the page never reads, so an editor changes it
 * and nothing happens. It also catches the opposite -- a field the component can
 * overlay but the seed never wrote, which would leave the editor showing nothing
 * for a field the page renders.
 *
 * Finally it asserts the seeded value is identical to the shipped copy, which is
 * what makes the API a safe overlay: with the database seeded, a page renders
 * exactly as it did before, so a broken API can only lose the *edits*, never
 * blank a page.
 *
 *   cd frontend && node tools/verify-cms-keys.mjs
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const appDir = join(here, '..', 'src', 'app');
const snapshot = JSON.parse(readFileSync(join(here, '..', '..', 'backend', 'cms_snapshot.json'), 'utf8'));

function loadData(relative) {
  const source = readFileSync(join(appDir, relative), 'utf8');
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('exports', 'module', 'require', js)(module.exports, module, require);
  return module.exports;
}

let passed = 0;
let failed = 0;
const check = (ok, label, detail) => {
  if (ok) {
    passed++;
  } else {
    failed++;
    console.log(`  FAIL  ${label}`);
    if (detail !== undefined) {
      console.log(`        ${JSON.stringify(detail).slice(0, 300)}`);
    }
  }
};

/**
 * Structural equality that ignores key order.
 *
 * Needed because the seed round-trips through JSON: a record written as
 * `{q, a}` comes back as `{a, q}` and `JSON.stringify` would call that a
 * difference even though the text is identical. Comparing key-sorted values
 * separates a real content difference from a serialisation artefact, which is
 * the distinction that decides whether copy was actually corrupted.
 */
function same(a, b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== typeof b) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, i) => same(item, b[i]));
  }
  if (typeof a !== 'object') return false;
  const ka = Object.keys(a).sort();
  const kb = Object.keys(b).sort();
  if (ka.length !== kb.length || ka.some((k, i) => k !== kb[i])) return false;
  return ka.every(k => same(a[k], b[k]));
}

const blocksOf = slug => snapshot[slug]?.blocks ?? {};

/** Fields each data type exposes to the CMS, mirroring the component key maps. */
const SOLUTION_FIELDS = [
  'title', 'summary', 'headline', 'tagline', 'heroImage', 'opportunity',
  'challenges', 'approach', 'delivery', 'deliveryHeading', 'closing', 'whyDinq',
  'faq', 'ctaLabel',
];
const INDUSTRY_FIELDS = [
  'title', 'summary', 'heroImage', 'lede', 'opportunity', 'clientNeeds',
  'support', 'supportCopy', 'relatedSolutions', 'ctaLabel',
];
const ARTICLE_FIELDS = ['title', 'author', 'date', 'category', 'featuredImage', 'summary', 'body'];

const LIST_FIELDS = new Set([
  'challenges', 'delivery', 'faq', 'clientNeeds', 'support', 'relatedSolutions', 'body',
]);

/**
 * Compare one page's seeded blocks against the static entry.
 * Reports an orphan block, a missing block, and a value mismatch separately,
 * because they need different fixes.
 */
function comparePage(slug, staticEntry, fields) {
  const blocks = blocksOf(slug);
  const label = slug;

  // 1. Every seeded block must be a key the page actually reads.
  for (const key of Object.keys(blocks)) {
    check(fields.includes(key), `${label}: "${key}" is seeded but not read by the page`, {
      read: fields,
    });
  }

  // 2. Every field the page reads must have been seeded.
  for (const field of fields) {
    if (staticEntry[field] === undefined) {
      continue; // optional and absent, so nothing to seed
    }
    check(field in blocks, `${label}: "${field}" is rendered but not seeded`, [...Object.keys(blocks)]);
  }

  // 3. Seeded value must equal the shipped copy, so the overlay is a no-op.
  for (const field of fields) {
    if (staticEntry[field] === undefined || !(field in blocks)) {
      continue;
    }
    const stored = blocks[field];
    const expected = staticEntry[field];
    if (LIST_FIELDS.has(field)) {
      check(
        same(stored.data, expected),
        `${label}: "${field}" seeded value differs from the shipped copy`,
        { seeded: stored.data, shipped: expected },
      );
    } else {
      check(
        stored.value === expected,
        `${label}: "${field}" seeded value differs from the shipped copy`,
        { seeded: stored.value, shipped: expected },
      );
    }
  }
}

console.log('Solutions detail pages');
const solutions = loadData('solutions/solutions-data.ts');
for (const [slug, detail] of Object.entries(solutions.SOLUTION_DETAILS)) {
  comparePage(`solution-${slug}`, detail, SOLUTION_FIELDS);
}

console.log('Industry detail pages');
const industries = loadData('industries/industries-data.ts');
for (const [slug, detail] of Object.entries(industries.INDUSTRY_DETAILS)) {
  comparePage(`industry-${slug}`, detail, INDUSTRY_FIELDS);
}

console.log('Insight articles');
const insights = loadData('insights/insights-data.ts');
for (const article of insights.INSIGHTS) {
  comparePage(`insight-${article.slug}`, article, ARTICLE_FIELDS);
}

console.log('Home page: industries section');
const homeBlocks = blocksOf('home');
const homeIndustries = ['industries.title', 'industries.core', 'industries.sectors'];
for (const key of homeIndustries) {
  check(key in homeBlocks, `home: "${key}" is rendered but not seeded`, [...Object.keys(homeBlocks)]);
}
if (homeBlocks['industries.core']) {
  check(
    same(homeBlocks['industries.core'].data, industries.CORE_INDUSTRIES),
    'home: "industries.core" seeded value differs from CORE_INDUSTRIES',
  );
}
if (homeBlocks['industries.sectors']) {
  check(
    same(homeBlocks['industries.sectors'].data, industries.ALL_SECTORS),
    'home: "industries.sectors" seeded value differs from ALL_SECTORS',
  );
}
if (homeBlocks['industries.title']) {
  check(
    homeBlocks['industries.title'].value === 'Core Industries',
    'home: "industries.title" seeded value differs from the shipped copy',
    { seeded: homeBlocks['industries.title'].value },
  );
}

console.log('Solutions index cards');
const solIndex = blocksOf('solutions');
const cardBlock = solIndex['cards'];
check(!!cardBlock, 'solutions: the card list is seeded');
if (cardBlock) {
  const cards = solutions.SOLUTION_CARDS;
  check(cardBlock.data.length === cards.length, 'solutions: card count matches SOLUTION_CARDS', {
    seeded: cardBlock.data.length,
    shipped: cards.length,
  });
  cards.forEach((card, i) => {
    const row = cardBlock.data[i] ?? {};
    check(row.slug === card.slug, `solutions: card ${i} slug matches`, { seeded: row.slug, shipped: card.slug });
    check(row.text === card.text, `solutions: card ${i} blurb matches the shipped copy`, {
      seeded: row.text,
      shipped: card.text,
    });
  });
}

console.log(`\n${'='.repeat(46)}\n${passed} passed, ${failed} failed\n${'='.repeat(46)}`);
process.exit(failed ? 1 : 0);
