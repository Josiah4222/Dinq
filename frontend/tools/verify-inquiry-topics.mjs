#!/usr/bin/env node
/**
 * Checks the inquiry-topic parsing in src/app/core/inquiry-topics.service.ts.
 *
 * The topics come from a public CMS endpoint whose rows are untrusted, so the
 * rules that turn them into a renderable list are worth pinning: keep only
 * active rows, drop anything without a label or a known group, sort by order
 * then label, and land the result in the two columns the form renders.
 *
 * The endpoint does not exist yet in the backend, so this file is also the
 * contract the implementer builds against: what the wire shape is, and how a
 * malformed row is treated.
 *
 * The service is checked in node rather than through `ng test` because the
 * parsing is plain functions with no Angular state, and karma needs a browser.
 * Node's own type stripping runs the shipped TypeScript (v23.6+, no flag);
 * only the two Angular-http imports are replaced with stubs, which the pure
 * functions being tested never touch.
 *
 *   node tools/verify-inquiry-topics.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '../src/app/core/inquiry-topics.service.ts');

let passed = 0;
let failed = 0;

function check(label, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label} ${JSON.stringify(detail ?? '')}`);
  }
}

function ids(topics) {
  return topics.map(topic => topic.id);
}

// ---------------------------------------------------------------------------
// Copy the module under test into a temp dir, stripping the two HTTP imports.
// The parsed values stay as shipped; only the field initialisers that build an
// HttpContext for the real request are swapped for inert stubs, and those
// initialisers never run — the class is never instantiated here.
// ---------------------------------------------------------------------------

const work = mkdtempSync(join(here, '.tmp-verify-inquiry-'));
const target = join(work, 'inquiry-topics.service.ts');

try {
  const real = readFileSync(source, 'utf8');
  const stubbed = real
    .replace(
      /^import \{ HttpClient, HttpContext \} from '@angular\/common\/http';$/m,
      'const HttpContext = class { set(...args) { return this; } };\n' +
        'const HttpClient = class { get<T>(...args: any[]): any { return { pipe: () => ({ subscribe: () => {} }) }; } };',
    )
    .replace(
      /^import \{ Injectable, inject, signal \} from '@angular\/core';$/m,
      'type Signal<T> = any;\n' +
        'const Injectable = ((config) => (() => {})) as any;\n' +
        'const inject = <T>(token: new (...args: any[]) => T) => new token();\n' +
        'function signal<T>(initial: T) { return { value: initial, set: (v: T) => {}, asReadonly: () => ({ value: initial }) }; }',
    )
    .replace(
      /^import \{ Observable, catchError, map, of, shareReplay \} from 'rxjs';$/m,
      'type Observable<T> = any;\n' +
        'const catchError = (...args) => (source) => source;\n' +
        'const map = (...args) => (source) => source;\n' +
        'const of = (...values) => ({} as any);\n' +
        'const shareReplay = (...args) => (source) => source;',
    )
    .replace(/^import \{ SKIP_AUTH_REDIRECT \} from '\.\/auth\.service';$/m, "const SKIP_AUTH_REDIRECT = 'stub';");

  writeFileSync(target, stubbed);

  // Transpile with the project's own compiler so the emitted module is the
  // shipping TypeScript, decorator and all. The temp dir lives under the
  // frontend so `@angular/core` and `rxjs` resolve from its node_modules.
  const tsc = resolve(here, '../node_modules/typescript/bin/tsc');
  let transpileFailure;
  try {
    execFileSync(
      process.execPath,
      [
        tsc, target,
        '--outDir', join(work, 'out'),
        '--module', 'commonjs',
        '--target', 'es2020',
        '--experimentalDecorators',
        '--moduleResolution', 'node',
        '--skipLibCheck',
      ],
      { stdio: 'pipe' },
    );
  } catch (error) {
    transpileFailure = error.stdout?.toString() ?? error.message;
  }

  if (transpileFailure) {
    // Cleaned up here rather than in `finally`, which `process.exit` skips.
    rmSync(work, { recursive: true, force: true });
    console.error('Transpiling the module under test failed:\n' + transpileFailure);
    process.exit(1);
  }

  const { normaliseTopics, DEFAULT_INQUIRY_TOPICS, TOPIC_GROUPS } = await import(
    pathToFileURL(join(work, 'out', 'inquiry-topics.service.js')).href
  );

  console.log('\nWire shape');
  check('a non-array response yields nothing', normaliseTopics({ nope: true }).length === 0);
  check('a string response yields nothing', normaliseTopics('hi').length === 0);
  check('a null response yields nothing', normaliseTopics(null).length === 0);
  check('a row with no label is dropped', normaliseTopics([{ id: 'x', group: 'canadian', order: 1 }]).length === 0);
  check('a row with no group is dropped', normaliseTopics([{ id: 'x', label: 'Ship', order: 1 }]).length === 0);
  check(
    'an unrecognised group is dropped',
    normaliseTopics([{ id: 'x', label: 'Ship', group: 'europe', order: 1 }]).length === 0,
  );
  check(
    'a label is a trimmed string, not a number',
    normaliseTopics([{ id: 'x', label: 42, group: 'canadian', order: 1 }]).length === 0,
  );
  check(
    'an id is synthesised when absent',
    normaliseTopics([{ label: 'Agribusiness', group: 'ethiopia', order: 1 }])[0].id === 'ethiopia-agribusiness',
  );

  console.log('\nFiltering and sorting');
  const rows = [
    { id: 'b', label: 'Mining', group: 'ethiopia', order: 20, active: true },
    { id: 'a', label: 'Energy', group: 'ethiopia', order: 10, active: true },
    { id: 'c', label: 'Hidden', group: 'ethiopia', order: 5, active: false },
    { id: 'd', label: 'Ghost', group: 'canadian', order: 10, active: false },
    { id: 'e', label: 'Aardvark', group: 'ethiopia', order: 10, active: true },
  ];
  const sorted = normaliseTopics(rows);
  check('inactive topics are hidden', !ids(sorted).includes('c') && !ids(sorted).includes('d'));
  check(
    'rows sort by order, then label',
    JSON.stringify(ids(sorted)) === JSON.stringify(['e', 'a', 'b']),
    ids(sorted),
  );
  check(
    'a tie on order is broken by label',
    normaliseTopics([
      { id: 'later', label: 'Zebra', group: 'canadian', order: 5 },
      { id: 'earlier', label: 'Aardvark', group: 'canadian', order: 5 },
    ])[0].id === 'earlier',
  );
  check(
    'order outranks label',
    normaliseTopics([
      { id: 'a-late', label: 'Aardvark', group: 'canadian', order: 90 },
      { id: 'b-early', label: 'Zebra', group: 'canadian', order: 5 },
    ])[0].id === 'b-early',
  );
  check(
    'an absent active flag is treated as active',
    normaliseTopics([{ id: 'x', label: 'Ship', group: 'canadian', order: 1 }]).length === 1,
  );
  check(
    'an explicit string active is honoured',
    normaliseTopics([{ id: 'x', label: 'Ship', group: 'canadian', order: 1, active: false }]).length === 0,
  );
  check(
    'order is coerced from a string',
    normaliseTopics([{ id: 'x', label: 'Ship', group: 'canadian', order: '9' }])[0].order === 9,
  );

  console.log('\nColumn groupings');
  // `d` is canadian but inactive, so this fixture only reaches the form with one
  // column populated; the grouping rule is checked against a fixture with both.
  const both = normaliseTopics([
    ...rows,
    { id: 'canadian-live', label: 'Advisory', group: 'canadian', order: 10, active: true },
  ]);
  const groups = new Set(both.map(topic => topic.group));
  check(
    'only the two known groups survive',
    JSON.stringify([...groups].sort()) === JSON.stringify([...TOPIC_GROUPS].sort()),
    [...groups],
  );
  check('TOPIC_GROUPS names the two columns in order', JSON.stringify(TOPIC_GROUPS) === '["canadian","ethiopia"]');

  console.log('\nDefaults');
  check('the shipped defaults are all active', DEFAULT_INQUIRY_TOPICS.every(topic => topic.active === true));
  check(
    'every default belongs to a known group',
    DEFAULT_INQUIRY_TOPICS.every(topic => TOPIC_GROUPS.includes(topic.group)),
  );
  check('defaults cover both columns', new Set(DEFAULT_INQUIRY_TOPICS.map(topic => topic.group)).size === 2);
  check(
    'defaults are usable by the form (unique ids, non-empty labels)',
    new Set(DEFAULT_INQUIRY_TOPICS.map(topic => topic.id)).size === DEFAULT_INQUIRY_TOPICS.length &&
      DEFAULT_INQUIRY_TOPICS.every(topic => topic.label.length > 0),
  );

  // The seeded list lives in the backend and overwrites the defaults whenever it
  // answers, so a slug present in one and not the other means either a 404 in the
  // form or a topic that vanishes on the next deploy. Compared here so the
  // mismatch is caught in CI rather than in the browser.
  console.log('\nAgainst the backend seed');
  const seedPath = resolve(here, '../../backend/cms/topics_seed.py');
  let seeded = null;
  try {
    const source = readFileSync(seedPath, 'utf8');
    const rows = source.slice(source.indexOf('INQUIRY_TOPICS'), source.indexOf('\n]\n', source.indexOf('INQUIRY_TOPICS')));
    seeded = [...rows.matchAll(/'slug':\s*'([^']+)'/g)].map(match => match[1]);
  } catch {
    console.log('  SKIP  backend/cms/topics_seed.py not found');
  }
  if (seeded) {
    const shipped = DEFAULT_INQUIRY_TOPICS.map(topic => topic.id);
    check(
      'the seed and the shipped defaults list the same slugs',
      JSON.stringify(seeded) === JSON.stringify(shipped),
      { seed: seeded.length, defaults: shipped.length },
    );
    check(
      'no slug is in the seed but not in the defaults',
      seeded.every(slug => shipped.includes(slug)),
      seeded.filter(slug => !shipped.includes(slug)),
    );
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

console.log(`\n${'='.repeat(46)}\n${passed} passed, ${failed} failed\n${'='.repeat(46)}`);
process.exit(failed ? 1 : 0);