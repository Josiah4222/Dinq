#!/usr/bin/env node
/**
 * Checks the CMS overlay helpers in src/app/core/cms-merge.ts.
 *
 * These helpers are the guard that stands between a bad edit and a broken
 * public page: a value that is blank, of the wrong type, or missing has to leave
 * the shipped copy standing. Nothing else re-checks that, and a regression here
 * would blank real content in production rather than fail a build, so it is
 * worth pinning down even though it is a handful of pure functions.
 *
 * They are checked in node rather than through `ng test` because they are plain
 * functions with no Angular dependencies, and karma needs a browser. The
 * TypeScript is transpiled to a temp directory first, with a stub for the
 * type-only import so no Angular code has to be resolved at runtime.
 *
 *   node tools/verify-cms-merge.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '../src/app/core/cms-merge.ts');

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

function equal(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

// ---------------------------------------------------------------------------
// Compile the module under test to plain JavaScript we can import.
// ---------------------------------------------------------------------------

const work = mkdtempSync(join(tmpdir(), 'dinq-merge-'));

try {
  mkdirSync(join(work, 'out'), { recursive: true });

  // Start from the real file, declaring the types it imports and dropping the
  // import itself. The emitted JavaScript never references them, so this keeps
  // the real logic under test without resolving @angular/core.
  const real = readFileSync(source, 'utf8');
  writeFileSync(
    join(work, 'cms-merge.ts'),
    `export interface ListItem { key?: string; text?: string; [k: string]: unknown }\n` +
      `export type PageValues = Record<string, unknown> | null;\n` +
      real.replace(
        /^import \{ ListItem, PageValues \} from '\.\/page-content\.service';$/m,
        '',
      ),
  );
  writeFileSync(
    join(work, 'page-content.service.ts'),
    `export interface ListItem { key?: string; text?: string; [k: string]: unknown }\n` +
      `export type PageValues = Record<string, unknown> | null;\n`,
  );

  // The project's own tsc, resolved from node_modules, rather than npx: npx's
  // .cmd shim cannot be spawned directly on Windows.
  const tsc = resolve(here, '../node_modules/typescript/bin/tsc');
  execFileSync(process.execPath, [tsc, join(work, 'cms-merge.ts'), '--outDir', join(work, 'out'), '--module', 'commonjs', '--target', 'es2020', '--skipLibCheck'], {
    stdio: 'pipe',
  });

  const { overlay, overlayList, asTextItems } = await import(
    pathToFileURL(join(work, 'out', 'cms-merge.js')).href
  );

  // -------------------------------------------------------------------------
  // overlay: a bad value must never reach the page.
  // -------------------------------------------------------------------------

  console.log('\nA blank, wrong or missing value must not reach the page');
  const base = { title: 'Shipped title', body: 'Shipped body', items: ['a', 'b'] };
  const map = [
    { field: 'title', key: 'title' },
    { field: 'body', key: 'body' },
    { field: 'items', key: 'items', list: true },
  ];
  const kept = (values) => overlay(base, values, map);

  check('an empty string keeps the shipped copy', kept({ title: '' }).title === 'Shipped title');
  check('whitespace only keeps the shipped copy', kept({ title: '   ' }).title === 'Shipped title');
  check('an empty list keeps the shipped copy', equal(kept({ items: [] }).items, ['a', 'b']));
  check('null keeps the shipped copy', kept({ title: null }).title === 'Shipped title');
  check('undefined keeps the shipped copy', kept({ title: undefined }).title === 'Shipped title');
  check('a number keeps the shipped copy', kept({ title: 42 }).title === 'Shipped title');
  check('an object keeps the shipped copy', kept({ title: { a: 1 } }).title === 'Shipped title');
  check('an empty value map is a no-op', equal(kept({}), base));
  check('null values is a no-op', equal(kept(null), base));

  console.log('\nReal content still applies');
  check('a real string wins', kept({ title: 'Edited' }).title === 'Edited');
  check('surrounding spaces are kept as typed', kept({ title: ' Edited ' }).title === ' Edited ');
  check('a real list wins', equal(kept({ items: ['z'] }).items, ['z']));
  check('a key the page did not declare is ignored', kept({ nope: 'x' }).nope === undefined);
  check('the base object is not mutated', base.title === 'Shipped title');

  // -------------------------------------------------------------------------
  // overlayList: keyed repeatables.
  // -------------------------------------------------------------------------

  console.log('\noverlayList');
  const rows = [
    { key: 'one', text: 'First' },
    { key: 'two', text: 'Second' },
  ];
  const keyed = (row) => row.key;
  // `values` is the page's whole value map; the list sits under its block key.
  const V = (items) => ({ items });

  check(
    'a keyed entry updates in place',
    overlayList(rows, V([{ key: 'one', text: 'Changed' }]), 'items', keyed)[0].text === 'Changed',
  );
  check(
    'order follows the stored list',
    equal(
      overlayList(rows, V([{ key: 'two', text: 'B' }, { key: 'one', text: 'A' }]), 'items', keyed).map(
        (r) => r.key,
      ),
      ['two', 'one'],
    ),
  );
  check(
    'rows the editor did not mention are kept',
    overlayList(rows, V([{ key: 'one', text: 'A' }]), 'items', keyed).length === 2,
  );
  check('an empty list is a no-op', overlayList(rows, V([]), 'items', keyed).length === 2);
  check('a non-list is a no-op', overlayList(rows, { items: 'nope' }, 'items', keyed).length === 2);
  check('null values is a no-op', overlayList(rows, null, 'items', keyed).length === 2);
  check(
    'a new keyed row is appended',
    overlayList(rows, V([{ key: 'one', text: 'A' }, { key: 'three', text: 'New' }]), 'items', keyed)
      .length === 3,
  );
  check(
    'stored fields win over the static row',
    overlayList(rows, V([{ key: 'one', text: 'A', extra: 1 }]), 'items', keyed)[0].extra === 1,
  );
  check('the base array is not mutated', rows[0].text === 'First');

  // -------------------------------------------------------------------------
  // asTextItems.
  // -------------------------------------------------------------------------

  console.log('\nasTextItems');
  check('plain strings map through', equal(asTextItems(['a', 'b']), [{ text: 'a' }, { text: 'b' }]));
  check('objects map through', equal(asTextItems([{ text: 'c' }]), [{ text: 'c' }]));
  check('blanks are dropped', equal(asTextItems(['a', '', { text: '' }, {}]), [{ text: 'a' }]));
  check('a non-array is empty', equal(asTextItems(undefined), []));
} finally {
  rmSync(work, { recursive: true, force: true });
}

console.log(`\n${'='.repeat(46)}\n${passed} passed, ${failed} failed\n${'='.repeat(46)}`);
process.exit(failed ? 1 : 0);
