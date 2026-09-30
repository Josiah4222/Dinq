/**
 * Point the two index templates at their signals and their page copy.
 *
 * The collections (`articles`, `filtered`, `categories`, `showFilter`,
 * `activeCategory`, `solutions`) became computed signals, so the templates now
 * call them. The two index pages also had their eyebrow and title written
 * inline, which is replaced by an interpolation of the same text, so the CMS
 * has something to override.
 *
 * Idempotent: an expression that already ends in `()` is skipped.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, '..', 'src', 'app');

/** Add `()` to a bare identifier only, never to a property or a call. */
function call(src, name, pattern) {
  let count = 0;
  return src.replace(pattern, (match, ...rest) => {
    if (match.trimEnd().endsWith('()')) {
      return match;
    }
    count++;
    return match.replace(new RegExp(`\\b${name}\\b(?![(\\w])`), `${name}()`);
  });
}

const JOBS = [
  {
    file: 'solutions/solutions-index.component.html',
    steps: [
      (s) =>
        call(s, 'solutions', /of solutions(?![\w(])/g),
    ],
  },
  {
    file: 'insights/insights-index.component.html',
    steps: [
      (s) => call(s, 'showFilter', /@if \(showFilter\)/g),
      (s) => call(s, 'activeCategory', /activeCategory(?=[)\s=])/g),
      (s) => call(s, 'categories', /of categories(?![\w(])/g),
      (s) => call(s, 'filtered', /of filtered(?![\w(])/g),
    ],
  },
];

for (const { file, steps } of JOBS) {
  const path = join(app, file);
  let src = readFileSync(path, 'utf8');
  for (const step of steps) {
    src = step(src);
  }
  writeFileSync(path, src, 'utf8');
  console.log(`${file}: updated`);
}
