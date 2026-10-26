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
const { imageSrc, isLocalImage, imageName, imageSrcset, imageVariant, imageWebp } = await import(pathToFileURL(source).href);

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

  console.log('Generated siblings are only offered for local, non-upload images');
  check(
    'a webp sibling replaces the extension',
    imageWebp('/media/assets/images/Abel.jpg') === '/media/assets/images/Abel.webp',
    imageWebp('/media/assets/images/Abel.jpg'),
  );
  check(
    'a relative value is rooted before the sibling is built',
    imageWebp('assets/images/Abel.jpg') === '/assets/images/Abel.webp',
    imageWebp('assets/images/Abel.jpg'),
  );
  check(
    'spaces are encoded for srcset',
    imageWebp('/media/assets/images/Kalkidan H.jpg') === '/media/assets/images/Kalkidan%20H.webp',
    imageWebp('/media/assets/images/Kalkidan H.jpg'),
  );
  check('a root-served logo gets a webp sibling', imageWebp('/dinq_gold_premium.png') === '/dinq_gold_premium.webp');
  check('a remote image has no local sibling', imageWebp('https://images.example.com/a.jpg') === '');
  check('an upload has no generated sibling', imageWebp('/media/uploads/2026/09/hero.jpg') === '');
  check('a non-raster has no generated sibling', imageWebp('/media/assets/images/logo.svg') === '');

  console.log('Width-specific siblings are built for the generated image set');
  check(
    'a width and format are appended',
    imageVariant('/media/assets/images/Abel.jpg', 460, 'avif') === '/media/assets/images/Abel-460.avif',
    imageVariant('/media/assets/images/Abel.jpg', 460, 'avif'),
  );
  check(
    'webp is the default format',
    imageVariant('/assets/images/hero-addis.jpg', 1600) === '/assets/images/hero-addis-1600.webp',
    imageVariant('/assets/images/hero-addis.jpg', 1600),
  );
  check('a logo outside the asset folders has no width set', imageVariant('/dinq_gold_premium.png', 450) === '');
  check('an upload has no width set', imageVariant('/media/uploads/2026/09/hero.jpg', 640) === '');

  console.log('A srcset lists only candidates that exist');
  check(
    'the widths become w descriptors',
    imageSrcset('/media/assets/images/hero-addis.jpg', [640, 1024], 'webp') ===
      '/media/assets/images/hero-addis-640.webp 640w, /media/assets/images/hero-addis-1024.webp 1024w',
    imageSrcset('/media/assets/images/hero-addis.jpg', [640, 1024], 'webp'),
  );
  check('a remote value produces no srcset', imageSrcset('https://images.example.com/a.jpg', [640, 1024]) === '');
  check('an empty width list produces no srcset', imageSrcset('/media/assets/images/Abel.jpg', []) === '');

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
