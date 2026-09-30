/**
 * Add the call parentheses for the collections that became signals.
 *
 * The detail components used to hold plain arrays, so the templates wrote
 * `@for (x of industries)` and `@if (related.length)`. Those are now computed
 * signals, so they read `industries()` and `related()`. Only the collection
 * expressions are touched -- a `related` or `industries` that is already
 * followed by `(` is left alone, so this is safe to re-run.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, '..', 'src', 'app');

const TARGETS = [
  { file: 'solutions/solution-detail.component.html', names: ['industries', 'industriesCollapsed'] },
  { file: 'insights/insight-article.component.html', names: ['related'] },
];

for (const { file, names } of TARGETS) {
  const path = join(app, file);
  let src = readFileSync(path, 'utf8');
  let changed = 0;

  for (const name of names) {
    src = src
      // `of industries;` / `of industries;` inside @for, and `if (industries.length)`
      .replace(new RegExp(`\\bof ${name}\\s*;`, 'g'), () => (changed++, `of ${name}();`))
      .replace(new RegExp(`\\(${name}\\.length\\)`, 'g'), () => (changed++, `(${name}().length)`))
      .replace(new RegExp(`\\(${name}\\)`, 'g'), () => (changed++, `(${name}())`));
  }

  writeFileSync(path, src, 'utf8');
  console.log(`${file}: ${changed} expressions now call the signal`);
}
