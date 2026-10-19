#!/usr/bin/env node
/**
 * Checks the vCard rules in src/app/core/vcard.ts.
 *
 * The failure this guards against is invisible: a malformed property does not
 * throw, it imports as a contact that is missing the number the visitor was
 * shown on the page. There is no way to see that from here, so the escaping,
 * folding, and number-normalising rules are pinned down in node instead of being
 * discovered on someone's phone.
 *
 * Checked in node rather than through `ng test` because these are plain functions
 * with no Angular dependencies, and karma needs a browser. The TypeScript is
 * compiled to a temp directory first, so the real file is what runs.
 *
 *   cd frontend && node tools/verify-vcard.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '../src/app/core/vcard.ts');

let passed = 0;
let failed = 0;

function check(label, condition, detail) {
  if (condition) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.log(`  FAIL  ${label}`);
    if (detail !== undefined) {
      console.log(`        ${JSON.stringify(detail).slice(0, 300)}`);
    }
  }
}

/** Every CRLF-separated line, with the folds rejoined, as the importer sees them. */
function properties(vcard) {
  return vcard
    .replace(/\r\n /g, '')
    .split('\r\n')
    .filter(Boolean);
}

function property(vcard, name) {
  return properties(vcard).find((line) => line.startsWith(name));
}

// ---------------------------------------------------------------------------
// Compile the module under test to plain JavaScript we can import.
// ---------------------------------------------------------------------------

const work = mkdtempSync(join(tmpdir(), 'dinq-vcard-'));

try {
  mkdirSync(join(work, 'out'), { recursive: true });
  writeFileSync(join(work, 'vcard.ts'), readFileSync(source, 'utf8'));

  // The project's own tsc, resolved from node_modules, rather than npx: npx's
  // .cmd shim cannot be spawned directly on Windows.
  const tsc = resolve(here, '../node_modules/typescript/bin/tsc');
  execFileSync(
    process.execPath,
    [
      tsc,
      join(work, 'vcard.ts'),
      '--outDir',
      join(work, 'out'),
      '--module',
      'commonjs',
      '--target',
      'es2020',
      '--skipLibCheck',
    ],
    { stdio: 'pipe' },
  );

  const { buildVCard, telHref, mailHref, vcardFileName } = await import(
    pathToFileURL(join(work, 'out', 'vcard.js')).href
  );

  // -------------------------------------------------------------------------
  // telHref: what the button dials.
  // -------------------------------------------------------------------------

  console.log('\nA phone number becomes a tel: link');
  check('an international number keeps its +', telHref('+251979893117') === 'tel:+251979893117');
  check('spaces are dropped', telHref('+251 979 893 117') === 'tel:+251979893117');
  check('dashes are dropped', telHref('+251-979-893-117') === 'tel:+251979893117');
  check('brackets and dots are dropped', telHref('(251) 979.893.117') === 'tel:251979893117');
  check(
    'a local number is not given a country code',
    telHref('0797 893117') === 'tel:0797893117',
    telHref('0797 893117'),
  );
  check('letters are dropped', telHref('+251 979 CALL') === 'tel:+251979');
  check('an empty value is an empty link', telHref('   ') === 'tel:');

  // -------------------------------------------------------------------------
  // mailHref: what the email button opens.
  // -------------------------------------------------------------------------

  console.log('\nAn address becomes a mailto: link');
  check('a plain address is wrapped', mailHref('abel@dinqadvisory.com') === 'mailto:abel@dinqadvisory.com');
  check('an existing mailto: is kept', mailHref('mailto:a@b.com') === 'mailto:a@b.com');
  check('a URL is refused', mailHref('https://example.com/abel') === null);
  check('an empty value is refused', mailHref('') === null);

  // -------------------------------------------------------------------------
  // vcardFileName: the extension is what opens the contact importer.
  // -------------------------------------------------------------------------

  console.log('\nThe filename is a .vcf');
  check('a name slugifies', vcardFileName('Abel M. Giratta') === 'abel-m-giratta.vcf');
  check('accents are stripped', vcardFileName('José Ñuñez') === 'jose-nunez.vcf');
  check('punctuation is dropped', vcardFileName("Abel O'Brien-Smith") === 'abel-o-brien-smith.vcf');
  check('a name with nothing usable still names the file', vcardFileName('...') === 'contact.vcf');
  check('the extension is always .vcf', vcardFileName('Abel').endsWith('.vcf'));

  // -------------------------------------------------------------------------
  // buildVCard: the file itself.
  // -------------------------------------------------------------------------

  console.log('\nThe card carries the details the page shows');
  const card = buildVCard(
    {
      name: 'Abel M. Giratta',
      role: 'Founder & Managing Director',
      org: 'Dinq Advisory Group',
      phones: [
        { value: '+251979893117', mobile: true },
        { value: '+251911000000', label: 'Office' },
      ],
      email: 'abel@dinqadvisory.com',
      url: 'https://dinq.example/vcard/abel-giratta',
    },
    new Date('2026-10-04T09:00:00Z'),
  );

  check('it opens a card', property(card, 'BEGIN:VCARD') === 'BEGIN:VCARD');
  check('it closes a card', property(card, 'END:VCARD') === 'END:VCARD');
  check('it declares a version', property(card, 'VERSION:') === 'VERSION:3.0');
  check('the display name is there', property(card, 'FN:') === 'FN:Abel M. Giratta');
  check(
    'the family name comes first in N',
    property(card, 'N:') === 'N:Giratta;Abel M.;;;',
    property(card, 'N:'),
  );
  check('the organisation is there', property(card, 'ORG:') === 'ORG:Dinq Advisory Group');
  check('the title is there', property(card, 'TITLE:') === 'TITLE:Founder & Managing Director');
  check(
    'a mobile number is typed CELL',
    property(card, 'TEL;TYPE=CELL') === 'TEL;TYPE=CELL,VOICE:+251979893117',
    property(card, 'TEL;TYPE=CELL'),
  );
  check('both numbers are present', (card.match(/^TEL/mg) || []).length === 2);
  check(
    'no number carries formatting',
    properties(card)
      .filter((line) => line.startsWith('TEL'))
      .every((line) => /^\+?\d+$/.test(line.slice(line.indexOf(':') + 1))),
  );
  check(
    'the email is typed WORK',
    property(card, 'EMAIL') === 'EMAIL;TYPE=INTERNET,WORK:abel@dinqadvisory.com',
  );
  check(
    'the page it came from is kept',
    property(card, 'URL:') === 'URL:https://dinq.example/vcard/abel-giratta',
  );
  check('the revision is UTC with no milliseconds', property(card, 'REV:') === 'REV:2026-10-04T09:00:00Z');
  check('lines end with CRLF', card.endsWith('END:VCARD\r\n'));
  check('no bare newlines', !/[^\r]\n/.test(card));
  check('no empty property lines', !/^:\r/m.test(card));

  console.log('\nA missing detail is left out rather than saved empty');
  const bare = buildVCard({ name: 'Abel M. Giratta' });
  check('no empty TEL line', !/^TEL/m.test(bare));
  check('no empty EMAIL line', !/^EMAIL/m.test(bare));
  check('no empty ORG line', !/^ORG/m.test(bare));
  check('no empty TITLE line', !/^TITLE/m.test(bare));
  check('no empty URL line', !/^URL/m.test(bare));
  check('no REV when no date was given', !/^REV/m.test(bare));
  check('it is still a valid card', property(bare, 'BEGIN:VCARD') === 'BEGIN:VCARD' && property(bare, 'END:VCARD') === 'END:VCARD');

  console.log('\nA number nobody can dial is dropped');
  const noNumber = buildVCard({ name: 'Abel M. Giratta', phones: [{ value: '' }, { value: '  ' }] });
  check('it carries no TEL line', !/^TEL/m.test(noNumber));
  const noEmail = buildVCard({ name: 'Abel M. Giratta', email: 'https://example.com' });
  check('a URL pasted into the email field is dropped', !/^EMAIL/m.test(noEmail));

  console.log('\nSeparators in a value are escaped');
  const escaped = buildVCard({
    name: 'Abel M. Giratta',
    org: 'Smith, Jones & Co; Legal',
    role: 'Partner\\Business',
    note: 'First line\nSecond line',
  });
  check('a comma is escaped', property(escaped, 'ORG:') === 'ORG:Smith\\, Jones & Co\\; Legal');
  check('a backslash is escaped', property(escaped, 'TITLE:') === 'TITLE:Partner\\\\Business');
  check('a newline is folded to \\n', property(escaped, 'NOTE:') === 'NOTE:First line\\nSecond line');
  check(
    'an escaped semicolon stays in the organisation',
    (property(escaped, 'N:') || '').split(';').length === 5,
    property(escaped, 'N:'),
  );

  console.log('\nA long value is folded rather than truncated');
  const longNote = buildVCard({ name: 'Abel M. Giratta', note: 'word '.repeat(40).trim() });
  const unfolded = properties(longNote);
  const rejoined = unfolded.find((line) => line.startsWith('NOTE:'));
  check('the whole note survives the fold', rejoined === `NOTE:${'word '.repeat(40).trim()}`, rejoined?.slice(0, 60));
  check('the file has a folded line', longNote.includes('\r\n '));
  check(
    'no physical line is over 75 octets',
    longNote.split('\r\n').every((line) => Buffer.byteLength(line, 'utf8') <= 75),
    longNote.split('\r\n').map((line) => Buffer.byteLength(line, 'utf8')).filter((n) => n > 75),
  );

  console.log('\nA name with no space still produces a valid N');
  check('a single name fills the family field', property(buildVCard({ name: 'Abel' }), 'N:') === 'N:Abel;;;;');
  check(
    'a one-word name does not shift the other fields',
    property(buildVCard({ name: 'Abel' }), 'FN:') === 'FN:Abel',
  );

  console.log('\nBuilding twice with no clock gives the same file');
  check(
    'output is a pure function of its input',
    buildVCard({ name: 'Abel M. Giratta', email: 'a@b.com' }) ===
      buildVCard({ name: 'Abel M. Giratta', email: 'a@b.com' }),
  );
} finally {
  rmSync(work, { recursive: true, force: true });
}

console.log(`\n${'='.repeat(46)}\n${passed} passed, ${failed} failed\n${'='.repeat(46)}`);
process.exit(failed ? 1 : 0);