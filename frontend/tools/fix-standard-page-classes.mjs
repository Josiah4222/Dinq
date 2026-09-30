/**
 * Repair the two CSS class attributes the previous pass over-matched.
 *
 * The rewrite used `\bhero\b`, and `-` is a word boundary, so `sp-hero` became
 * `sp-hero()` inside the class attribute. Only the class attributes are
 * affected; the intended `hero()` calls are in bindings and interpolation.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const path = join(here, '..', 'src', 'app', 'standard-page', 'standard-page.component.html');

let src = readFileSync(path, 'utf8');
const before = (src.match(/hero\(\)/g) ?? []).length;

src = src.split('class="sp-hero() sp-hero()--gradient"').join('class="sp-hero sp-hero--gradient"');
src = src.split('class="sp-hero()"').join('class="sp-hero"');

writeFileSync(path, src, 'utf8');
console.log(`hero() calls: ${before} -> ${(src.match(/hero\(\)/g) ?? []).length}`);
console.log(`stray sp-hero(): ${(src.match(/sp-hero\(\)/g) ?? []).length}`);
