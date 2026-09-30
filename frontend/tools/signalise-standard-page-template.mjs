/**
 * Point the Standard Content Page template at its signals.
 *
 * `hero`, `sections` and `navItems` were plain properties read from route data;
 * they are now computeds with the CMS values laid over that data, so the
 * template calls them. Aliasing inside @if was avoided deliberately -- rewriting
 * `@if (hero.image)` into a nested block changes the brace structure of the
 * template, and a call at each use is both simpler and easier to review.
 *
 * Idempotent: an identifier already followed by `()` is skipped.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const path = join(here, '..', 'src', 'app', 'standard-page', 'standard-page.component.html');

let src = readFileSync(path, 'utf8');
let changed = 0;

function rewrite(pattern, name) {
  src = src.replace(pattern, match => {
    if (new RegExp(`${name}\\s*\\(\\s*$`).test(match)) {
      return match;
    }
    changed++;
    return match.replace(new RegExp(`\\b${name}\\b(?!\\s*\\()`), `${name}()`);
  });
}

// `hero.image`, `hero.title`, ... and `@if (hero.image)`.
rewrite(/\bhero\b(?![\w(])/g, 'hero');
rewrite(/of sections(?![\w(])/g, 'sections');
rewrite(/of navItems(?![\w(])/g, 'navItems');

writeFileSync(path, src, 'utf8');
console.log(`standard-page.component.html: ${changed} references now call the signal`);
