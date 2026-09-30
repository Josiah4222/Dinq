/**
 * Extract the copy behind the data-driven pages into a CMS seed file.
 *
 * The Angular `*-data.ts` files are the shipped source of truth for these
 * pages. Transcribing them by hand into Python would risk silent corruption in
 * several hundred strings, so this reads the real values and writes them out
 * verbatim. The generated file is committed and used by `manage.py seed_cms`;
 * this script exists so it can be regenerated rather than hand-patched.
 *
 *   cd frontend && node tools/extract-cms-seed.mjs
 *
 * Field names and block keys are decided here, not in the data files: the
 * Angular interfaces are structural (they mirror the template) and the CMS
 * needs a stable key per editable value. Structural fields -- slug, route,
 * category, ordering, and cross links -- are deliberately not emitted, because
 * editing those from a text field would break navigation rather than improve
 * the copy.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const appDir = join(here, '..', 'src', 'app');
const outFile = join(here, '..', '..', 'backend', 'cms', 'generated_seed.json');
const extrasFile = join(here, '..', '..', 'backend', 'cms', 'generated_extras.json');

/** Load a TypeScript data module by transpiling it and evaluating the result. */
function loadData(relative) {
  const source = readFileSync(join(appDir, relative), 'utf8');
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('exports', 'module', 'require', js)(module.exports, module, require);
  return module.exports;
}

const text = (key, value, label) => ({ key, kind: 'text', label, value });
const area = (key, value, label) => ({ key, kind: 'textarea', label, value });
const image = (key, value, label) => ({ key, kind: 'image', label, value });
const list = (key, value, label) => ({ key, kind: 'list', label, data: value });

/** Only emit a field the data actually has, so `optional` stays optional. */
function maybe(builder, value, key, label) {
  return value === undefined || value === null ? [] : [builder(key, value, label)];
}

const pages = {};

function addPage(slug, meta, blocks) {
  if (pages[slug]) {
    throw new Error(`duplicate page slug: ${slug}`);
  }
  const ordered = blocks
    .filter(Boolean)
    .map((b, i) => ({
      key: b.key,
      kind: b.kind,
      label: b.label,
      order: i,
      ...(b.kind === 'list' ? { data: b.data } : { value: b.value ?? '' }),
    }));
  for (const b of ordered) {
    if (!b.key) {
      throw new Error(`block on ${slug} has no key: ${b.label}`);
    }
  }
  pages[slug] = { ...meta, blocks: ordered };
}

// ---------------------------------------------------------------------------
// Solutions: one page per detail, plus the index page's card list.
// ---------------------------------------------------------------------------
const solutions = loadData('solutions/solutions-data.ts');
const SOLUTION_FIELDS = [
  ['title', text, 'Title'],
  ['summary', area, 'Hero — summary'],
  ['headline', text, 'Hero — headline'],
  ['tagline', text, 'Hero — tagline'],
  ['heroImage', image, 'Hero — image'],
  ['opportunity', area, 'The Opportunity'],
  ['challenges', list, 'Common Challenges'],
  ['approach', area, 'Our Approach'],
  ['delivery', list, 'How Dinq can help'],
  ['deliveryHeading', text, 'Services list — heading'],
  ['closing', area, 'Services list — closing paragraph'],
  ['whyDinq', area, 'Why Dinq'],
  ['faq', list, 'FAQ'],
  ['ctaLabel', text, 'CTA — button label'],
];

for (const [slug, detail] of Object.entries(solutions.SOLUTION_DETAILS)) {
  const blocks = [];
  for (const [field, builder, label] of SOLUTION_FIELDS) {
    blocks.push(...maybe(builder, detail[field], field, label));
  }
  addPage(
    `solution-${slug}`,
    { title: detail.title, route: `/solutions/${slug}`, category: 'Solutions' },
    blocks,
  );
}

addPage(
  'solutions',
  { title: 'Solutions Overview', route: '/solutions', category: 'Solutions' },
  [
    list('cards', solutions.SOLUTION_CARDS, 'Solution cards'),
  ],
);

// ---------------------------------------------------------------------------
// Industries: one page per sector detail. `support` and `supportCopy` are
// alternatives, so only the one the data actually uses is emitted.
// ---------------------------------------------------------------------------
const industries = loadData('industries/industries-data.ts');
const INDUSTRY_FIELDS = [
  ['title', text, 'Title'],
  ['summary', area, 'Hero — summary'],
  ['heroImage', image, 'Hero — image'],
  ['lede', area, 'Hero — lead paragraph'],
  ['opportunity', area, 'Opportunity'],
  ['clientNeeds', list, 'Typical Client Needs'],
  ['support', list, 'How Dinq Supports the Sector — points'],
  ['supportCopy', area, 'How Dinq Supports the Sector — prose'],
  ['relatedSolutions', list, 'Related Solutions'],
  ['ctaLabel', text, 'CTA — button label'],
];

for (const [slug, detail] of Object.entries(industries.INDUSTRY_DETAILS)) {
  const blocks = [];
  for (const [field, builder, label] of INDUSTRY_FIELDS) {
    blocks.push(...maybe(builder, detail[field], field, label));
  }
  addPage(
    `industry-${slug}`,
    { title: detail.title, route: `/industries/${slug}`, category: 'Industries' },
    blocks,
  );
}

// ---------------------------------------------------------------------------
// Insights: one page per article. `relatedSlugs` is navigation, so it stays in
// the data file; the index card reuses the article's own title/summary/category
// rather than duplicating them, so a retitle reaches both at once.
// ---------------------------------------------------------------------------
const insights = loadData('insights/insights-data.ts');
for (const article of insights.INSIGHTS) {
  const slug = `insight-${article.slug}`;
  const blocks = [
    text('title', article.title, 'Title'),
    text('author', article.author, 'Author'),
    text('date', article.date, 'Date'),
    text('category', article.category, 'Category'),
    maybe(image, article.featuredImage, 'featuredImage', 'Featured image'),
    area('summary', article.summary, 'Summary'),
    list('body', article.body, 'Body paragraphs'),
  ].flat();
  addPage(slug, { title: article.title, route: `/insights/${article.slug}`, category: 'Insights' }, blocks);
}

// The insights index deliberately gets no `articles` block. Its cards are built
// from each article's own CMS page, so a title edited on an article reaches the
// index too; seeding a second copy here would be copy that can silently drift.
// Only the generated pages that hold copy of their own are listed below.

// ---------------------------------------------------------------------------
// The four Standard Content Pages still keep their copy in `app.routes.ts`, as
// route `data`. It is extracted by brace matching rather than by moving the
// objects into data files: the copy is already correct there, and relocating
// ~250 lines across four routes buys tidiness at the price of a refactor that
// could quietly alter a legal page. Only editable fields are emitted -- layout
// choices (`kind`, `tone`, `align`, `pending`) and links stay in the route,
// because changing those from a text field edits the design, not the copy.
// ---------------------------------------------------------------------------
const routes = readFileSync(join(appDir, 'app.routes.ts'), 'utf8');

/** Return the source of the `data: {...}` object for a given route path. */
function routeDataFor(path) {
  const pathAt = routes.indexOf(`path: '${path}'`);
  if (pathAt < 0) {
    throw new Error(`no route for path: ${path}`);
  }
  const dataAt = routes.indexOf('data: {', pathAt);
  if (dataAt < 0) {
    throw new Error(`route ${path} has no data block`);
  }
  const start = dataAt + 'data: '.length;

  // Walk to the matching brace, ignoring braces inside string literals -- the
  // copy contains apostrophes and parentheses but no braces of its own.
  let depth = 0;
  let quote = null;
  for (let i = start; i < routes.length; i++) {
    const ch = routes[i];
    if (quote) {
      if (ch === '\\') {
        i++;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return routes.slice(start, i + 1);
      }
    }
  }
  throw new Error(`unbalanced data block for ${path}`);
}

const STANDARD_PAGES = [
  { slug: 'why-ethiopia', title: 'Why Ethiopia', route: '/why-ethiopia', category: 'Our Work' },
  { slug: 'representative-matters', title: 'Representative Matters', route: '/representative-matters', category: 'Our Work' },
  { slug: 'privacy-policy', title: 'Privacy Policy', route: '/privacy-policy', category: 'Legal' },
  { slug: 'terms-of-use', title: 'Terms of Use', route: '/terms-of-use', category: 'Legal' },
];

for (const meta of STANDARD_PAGES) {
  const object = ts.transpileModule(`export const DATA = ${routeDataFor(meta.slug)};`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const holder = { exports: {} };
  new Function('exports', 'module', 'require', object)(holder.exports, holder, require);
  const data = holder.exports.DATA;

  const blocks = [];
  blocks.push(...maybe(text, data.hero?.eyebrow, 'hero.eyebrow', 'Hero — eyebrow'));
  blocks.push(...maybe(text, data.hero?.title, 'hero.title', 'Hero — title'));
  blocks.push(...maybe(area, data.hero?.lead, 'hero.lead', 'Hero — lead paragraph'));
  blocks.push(...maybe(image, data.hero?.image, 'hero.image', 'Hero — image'));

  for (const section of data.sections ?? []) {
    const id = section.id ?? 'section';
    const at = `sections.${id}`;
    blocks.push(...maybe(text, section.eyebrow, `${at}.eyebrow`, `${id} — eyebrow`));
    blocks.push(...maybe(text, section.heading, `${at}.heading`, `${id} — heading`));
    blocks.push(...maybe(text, section.text, `${at}.text`, `${id} — text`));
    blocks.push(...maybe(text, section.amharic, `${at}.amharic`, `${id} — Amharic accent`));
    blocks.push(...maybe(list, section.paragraphs, `${at}.paragraphs`, `${id} — paragraphs`));
    if (Array.isArray(section.items) && section.items.length) {
      // Records are keyed by position. The key is not editable, so it cannot
      // drift; ordering still follows the stored list, so a reorder in the
      // editor is reflected in the rendered order.
      const items = section.items.map((item, i) => ({ key: String(i), ...item }));
      blocks.push(list(`${at}.items`, items, `${id} — items`));
    }
  }

  addPage(meta.slug, { title: meta.title, route: meta.route, category: meta.category }, blocks);
}

mkdirSync(dirname(outFile), { recursive: true });

// ---------------------------------------------------------------------------
// Blocks that extend a page seeded elsewhere, rather than a page of their own.
//
// The home page's Industries section is the case that needed this. Its cards
// come from CORE_INDUSTRIES and ALL_SECTORS, the same data that links to the
// industry detail pages, so they were previously not editable at all: the
// comment in content_seed.py said so and left a known gap. They are seeded here
// as extra blocks on `home` rather than as a page, because the home page's own
// copy is hand-written for the layout reasons described in that file.
// ---------------------------------------------------------------------------
const extras = {
  home: [
    text('industries.title', 'Core Industries', 'Industries — section title'),
    list('industries.core', industries.CORE_INDUSTRIES, 'Industries — core cards'),
    list('industries.sectors', industries.ALL_SECTORS, 'Industries — additional sectors'),
  ].map((b, i) => ({ ...b, order: i })),
};

writeFileSync(extrasFile, JSON.stringify(extras, null, 2) + '\n', 'utf8');
console.log(`wrote ${extrasFile}`);
console.log(`  home +${extras.home.length} blocks`);

writeFileSync(outFile, JSON.stringify(pages, null, 2) + '\n', 'utf8');

const total = Object.values(pages).reduce((n, p) => n + p.blocks.length, 0);
console.log(`wrote ${outFile}`);
console.log(`${Object.keys(pages).length} pages, ${total} blocks`);
for (const [slug, page] of Object.entries(pages)) {
  console.log(`  ${slug.padEnd(58)} ${page.blocks.length}`);
}
