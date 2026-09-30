/**
 * Rewrite the three data-driven detail templates to read a signal.
 *
 * The templates all wrapped their content in `@if (detail) {` / `@if (article) {`
 * and then referenced `detail.x` throughout. With `detail` now a computed signal
 * the idiomatic form is `@if (detail(); as d) {` and `d.x` inside, which also
 * narrows the type so no non-null assertions are needed.
 *
 * Run once:  node tools/signalise-detail-templates.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, '..', 'src', 'app');

const TARGETS = [
  { file: 'solutions/solution-detail.component.html', guard: 'detail', alias: 'd' },
  { file: 'industries/industry-detail.component.html', guard: 'detail', alias: 'd' },
  { file: 'insights/insight-article.component.html', guard: 'article', alias: 'a' },
];

for (const { file, guard, alias } of TARGETS) {
  const path = join(app, file);
  let src = readFileSync(path, 'utf8');

  const openGuard = `@if (${guard}) {`;
  if (!src.includes(openGuard)) {
    throw new Error(`${file}: expected \`${openGuard}\` to open the page block`);
  }
  src = src.replace(openGuard, `@if (${guard}(); as ${alias}) {`);

  // Every remaining `<guard>.` is inside that block, which now aliases to `alias`.
  const before = src.split(`${guard}.`).length - 1;
  src = src.split(`${guard}.`).join(`${alias}.`);
  // The guard itself was rewritten first, so it is not counted above.
  const after = src.split(`${alias}.`).length - 1;

  writeFileSync(path, src, 'utf8');
  console.log(`${file}: guard -> ${guard}() as ${alias}, ${before} references rewritten (${after} now)`);
}
