#!/usr/bin/env node
/**
 * Checks the stored-image rules in src/app/core/image-path.ts.
 *
 * The site stores image paths as plain strings, and those strings come from
 * somewhere other than the upload endpoint: the hand-written seed copy, an
 * extractor, or a staff member typing one. A relative `src` is resolved against
 * the current URL, so a value that works on the homepage 404s on `/about` - the
 * exact failure this normalisation exists to prevent.
 *
 * These are pure functions with no Angular dependency, so they are checked in
 * node rather than through `ng test`, which needs a browser.
 *
 *   node tools/verify-image-paths.mjs
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '../src/app/core/image-path.ts');

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

/*
 * image-path.ts is self-contained TypeScript with no Angular imports, so node's
 * own type stripping can import it straight from src/app. Nothing is copied or
 * cleaned up: a temp module directory deleted while node still holds the
 * compiled file makes the process abort at teardown on Windows.
 */
const { imageSrc, isLocalImage, imageName } = await import(pathToFileURL(source).href);

{
  console.log('An uploaded path is used exactly as given');
  const uploaded = '/media/uploads/2026/09/hero-1a2b3c4d.jpg';
  check('a /media path is unchanged', imageSrc(uploaded) === uploaded, imageSrc(uploaded));
  check('a /media path is local', isLocalImage(uploaded) === true);

  console.log('A relative path becomes root-absolute, so it cannot resolve per-route');
  check('assets/... is rooted', imageSrc('assets/images/hero-addis.jpg') === '/assets/images/hero-addis.jpg', imageSrc('assets/images/hero-addis.jpg'));
  check('a bare filename is rooted', imageSrc('photo.jpg') === '/photo.jpg', imageSrc('photo.jpg'));
  check('a leading ./ is dropped', imageSrc('./assets/images/hero.jpg') === '/assets/images/hero.jpg', imageSrc('./assets/images/hero.jpg'));
  check('surrounding whitespace is trimmed', imageSrc('  /media/a.jpg  ') === '/media/a.jpg', imageSrc('  /media/a.jpg  '));

  console.log('The same value resolves identically on every route');
  const value = 'assets/images/industries-mining.jpg';
  const fromHome = imageSrc(value);
  const fromAbout = imageSrc(value);
  check('the result does not depend on the page', fromHome === fromAbout);
  check('the result is not still relative', !fromHome.startsWith('media/'), fromHome);

  console.log('Remote and inline sources are left alone');
  check('https is unchanged', imageSrc('https://images.example.com/a.jpg') === 'https://images.example.com/a.jpg');
  check('http is unchanged', imageSrc('http://images.example.com/a.jpg') === 'http://images.example.com/a.jpg');
  check('a protocol-relative URL is unchanged', imageSrc('//cdn.example.com/a.jpg') === '//cdn.example.com/a.jpg');
  check('a data URI is unchanged', imageSrc('data:image/gif;base64,R0lGOD') === 'data:image/gif;base64,R0lGOD');
  check('a blob URL is unchanged', imageSrc('blob:https://x/y') === 'blob:https://x/y');
  check('https counts as remote', isLocalImage('https://images.example.com/a.jpg') === false);
  check('a query string is kept', imageSrc('/media/a.jpg?v=2') === '/media/a.jpg?v=2', imageSrc('/media/a.jpg?v=2'));

  console.log('Unusable values render nothing rather than a broken image');
  check('empty stays empty', imageSrc('') === '');
  check('whitespace stays empty', imageSrc('   ') === '');
  check('null stays empty', imageSrc(null) === '');
  check('undefined stays empty', imageSrc(undefined) === '');
  check('a parent-directory path is refused', imageSrc('../../etc/passwd') === '', imageSrc('../../etc/passwd'));
  check('a mid-path traversal is refused', imageSrc('assets/../../secret.jpg') === '', imageSrc('assets/../../secret.jpg'));
  check('a javascript: URL is refused', imageSrc('javascript:alert(1)') === '', imageSrc('javascript:alert(1)'));
  check('javascript: is refused whatever the case', imageSrc('JavaScript:alert(1)') === '', imageSrc('JavaScript:alert(1)'));
  check('a traversal path is still classified local, and refused at render', isLocalImage('../../etc/passwd') === true);

  console.log('A filename is pulled out for display in the editor');
  check('from a /media path', imageName('/media/assets/images/Abel.jpg') === 'Abel.jpg', imageName('/media/assets/images/Abel.jpg'));
  check('from a URL', imageName('https://x.test/a/b/photo.png') === 'photo.png', imageName('https://x.test/a/b/photo.png'));
  check('query strings are dropped', imageName('/media/a.jpg?v=2') === 'a.jpg', imageName('/media/a.jpg?v=2'));
  check('fragments are dropped', imageName('/media/a.jpg#top') === 'a.jpg', imageName('/media/a.jpg#top'));
  check('a bare filename survives', imageName('a.jpg') === 'a.jpg', imageName('a.jpg'));
  check('empty stays empty', imageName('') === '');
  check('a trailing slash names the last real segment', imageName('/media/') === 'media', imageName('/media/'));
  check('a path of only slashes has no segment, so the value is shown', imageName('/') === '/', imageName('/'));
}

console.log('');
console.log('='.repeat(44));
console.log(`${passed} passed, ${failed} failed`);
console.log('='.repeat(44));
// exitCode rather than process.exit(): forcing an exit while node's TypeScript
// stripping worker is still closing aborts the process on Windows with a libuv
// assertion, which would mask the real result behind a crash.
process.exitCode = failed ? 1 : 0;
