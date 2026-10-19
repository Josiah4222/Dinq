/**
 * Assembling a vCard file (RFC 6350 / the 3.0 dialect phones import most
 * reliably) from the contact values a page holds.
 *
 * Kept apart from the component because this is the part that has to be right:
 * a vCard is consumed by the phone's own importer, so a malformed property does
 * not produce a visible error on this site — it produces a contact saved with no
 * phone number on it. Every function here is pure and takes its subject as an
 * argument, so the rules can be exercised without a browser (see
 * `tools/verify-vcard.mjs`).
 */

/** One phone number as it should be stored and as it should be displayed. */
export interface VCardPhone {
  /** Stored value, however the editor typed it. Normalised on the way out. */
  value: string;
  /** Shown above the number. Omitted from the file's TYPE when empty. */
  label?: string;
  /** A CELL rather than a VOICE line, which is what makes iOS offer it for SMS. */
  mobile?: boolean;
}

/** The contact details a vCard is built from. Every field except `name` is optional. */
export interface VCardContact {
  name: string;
  /** Job title, written as the card shows it. */
  role?: string;
  /** Organisation or company. */
  org?: string;
  phones?: VCardPhone[];
  email?: string;
  /** The page the card was saved from, kept so the contact is traceable back. */
  url?: string;
  /** Free text stored on the contact entry. */
  note?: string;
}

/**
 * Characters that end a vCard property early, and so have to be escaped with a
 * backslash. A semicolon is the important one: `N` is a structured value, and an
 * unescaped semicolon inside a company name turns the rest of the line into
 * extra name components in the importer.
 */
const NEEDS_ESCAPE = /([\\,;])/g;

const NEWLINES = /\r\n|\r|\n/g;

/**
 * Stands in for a line break while the escaping pass runs. A NUL cannot appear
 * in text that came from a CMS field, and it survives the backslash pass without
 * being touched.
 */
const NEWLINE_PLACEHOLDER = '\u0000';

/**
 * Escape a value for use inside a vCard property, and flatten it to one line.
 *
 * A line break becomes the two characters `\` and `n` rather than a real one,
 * because a raw newline would end the property. The order is deliberate: the
 * line breaks are held aside while the backslash, comma, and semicolon pass runs,
 * so the backslash this adds is not itself escaped back into `\\n` and read by
 * the importer as a literal backslash followed by the letter n.
 */
function escapeValue(value: string): string {
  return value
    .trim()
    .replace(NEWLINES, NEWLINE_PLACEHOLDER)
    .replace(NEEDS_ESCAPE, '\\$1')
    .replace(/\u0000/g, '\\n');
}

/**
 * A number as a `tel:` href: everything that is not a digit or a leading `+`
 * removed, so `(251) 979-893 117` and `+251 979 893 117` both dial correctly.
 *
 * The `+` is only kept when it is genuinely leading. A number written
 * `0797 893117` has no country code, and inventing one would dial the wrong
 * country, so it is left alone and the device resolves it locally.
 */
export function telHref(value: string): string {
  const raw = value.trim();
  const hasPlus = raw.startsWith('+');
  const digits = raw.replace(/\D/g, '');
  return hasPlus ? `tel:+${digits}` : `tel:${digits}`;
}

/**
 * Reduce a number to the digits a vCard TEL line carries.
 *
 * Formatting is display-only, and some importers treat spaces and dashes inside
 * a TEL value as literal characters — which leaves a contact whose number will
 * not dial. The display form is kept separately for the page itself.
 */
function telValue(value: string): string {
  return telHref(value).replace(/^tel:/, '');
}

/** An address as a `mailto:` href, or null when it is not an address. */
export function mailHref(value: string): string | null {
  const raw = value.trim();
  if (!raw) {
    return null;
  }
  if (/^mailto:/i.test(raw)) {
    return raw;
  }
  return raw.includes('@') && !raw.includes('/') ? `mailto:${raw}` : null;
}

/** The address itself, without the `mailto:` scheme, for a vCard EMAIL line. */
function emailValue(value: string): string | null {
  const href = mailHref(value);
  if (!href) {
    return null;
  }
  const address = href.replace(/^mailto:/i, '').split('?')[0].trim();
  return address.includes('@') ? address : null;
}

/**
 * Split a display name into the structured `N` value.
 *
 * vCard wants the family name first and separate from the given names, and
 * importers sort a contact by that field — so it is worth getting right rather
 * than writing the whole name into `N` and letting the phone guess. Names are
 * written here as "Given Family", which is the convention throughout this site.
 * A caller that knows better (a patronymic, a two-part surname) passes `family`
 * and `given` explicitly rather than having them guessed.
 */
function structuredName(name: string, family?: string, given?: string): string {
  if (family || given) {
    return [family ?? '', given ?? '', '', '', ''].join(';');
  }
  const parts = name.trim().split(/\s+/).filter(part => part.length > 0);
  if (parts.length === 0) {
    return ';;;;';
  }
  if (parts.length === 1) {
    return `${escapeValue(parts[0])};;;;`;
  }
  return `${escapeValue(parts[parts.length - 1])};${escapeValue(parts.slice(0, -1).join(' '))};;;`;
}

/**
 * Fold a long property onto continuation lines.
 *
 * The spec limits a line to 75 octets excluding the line break, and importers
 * that enforce it truncate the rest of the value rather than rejoining it — a
 * long note silently loses its tail. Folding counts UTF-8 bytes, not characters,
 * because the limit is in octets and a name with an accent or an emoji would
 * overshoot it if counted as characters.
 */
function fold(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) {
    return line;
  }

  const parts: string[] = [];
  let current = '';
  let used = 0;

  for (const character of line) {
    const size = encoder.encode(character).length;
    // Continuation lines start with a space, which counts towards the 75.
    const limit = parts.length === 0 ? 75 : 74;
    if (used + size > limit) {
      parts.push(current);
      current = '';
      used = 0;
    }
    current += character;
    used += size;
  }
  parts.push(current);

  return parts.join('\r\n ');
}

/**
 * A `.vcf` filename from a person's name: lower case, hyphenated, ending in
 * `.vcf` so a phone treats the download as a contact rather than a document.
 *
 * The extension matters. A file saved as `abel-giratta.txt` or with no
 * extension opens in a text viewer; `.vcf` is what opens the contact importer.
 */
export function vcardFileName(name: string): string {
  const slug = name
    .normalize('NFD')
    // Strip the combining marks left behind, so "José" becomes "jose" rather
    // than "jose" plus a character no filesystem expects.
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'contact'}.vcf`;
}

/**
 * Build the vCard file contents.
 *
 * Properties are emitted in the order the spec asks for, and every optional one
 * is omitted rather than emitted empty: an empty `EMAIL;TYPE=INTERNET,WORK:`
 * line is imported on some phones as a contact with a blank email field, which
 * is worse than no line at all.
 *
 * `rev` is passed in rather than read from the clock so the output is a pure
 * function of its arguments; the caller supplies the moment the card was saved.
 */
export function buildVCard(contact: VCardContact, rev?: Date): string {
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${structuredName(contact.name)}`,
    `FN:${escapeValue(contact.name)}`,
  ];

  if (contact.org) {
    lines.push(`ORG:${escapeValue(contact.org)}`);
  }
  if (contact.role) {
    lines.push(`TITLE:${escapeValue(contact.role)}`);
  }

  for (const phone of contact.phones ?? []) {
    const number = telValue(phone.value ?? '');
    if (!number) {
      continue;
    }
    const type = phone.mobile ? 'CELL,VOICE' : 'VOICE';
    lines.push(`TEL;TYPE=${type}:${number}`);
  }

  const email = emailValue(contact.email ?? '');
  if (email) {
    lines.push(`EMAIL;TYPE=INTERNET,WORK:${escapeValue(email)}`);
  }

  if (contact.url) {
    lines.push(`URL:${escapeValue(contact.url)}`);
  }
  if (contact.note) {
    lines.push(`NOTE:${escapeValue(contact.note)}`);
  }

  if (rev) {
    // REV is a UTC timestamp with no offset suffix, which is what the spec
    // asks for; a local time here makes the same card save differently on
    // every device it is shared between.
    lines.push(`REV:${rev.toISOString().replace(/\.\d{3}Z$/, 'Z')}`);
  }

  lines.push('END:VCARD');

  // CRLF throughout: the spec requires it, and a file written with bare newlines
  // is rejected outright by several importers.
  return lines.map(fold).join('\r\n') + '\r\n';
}

/**
 * Save a contact to the visitor's device, which on a phone means the contact
 * importer rather than a file in a downloads folder.
 *
 * The file is produced in the page rather than fetched from the server, so the
 * numbers on the card a visitor saves are the same values the page is currently
 * showing — a stale `.vcf` sitting in `public/` would quietly disagree with the
 * copy the visitor just read.
 *
 * The anchor is clicked rather than the URL opened, because the `download`
 * attribute is what triggers the importer; a bare `href` to a `.vcf` navigates
 * instead on some desktop browsers.
 */
export function saveVCard(contact: VCardContact, rev?: Date): void {
  const blob = new Blob([buildVCard(contact, rev ?? new Date())], {
    type: 'text/vcard;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = vcardFileName(contact.name);
  anchor.rel = 'noopener';
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // Released once the browser has taken a reference to the blob for the
  // download, which is immediate. Leaking one object URL per tap is enough to
  // pin the whole card in memory for the life of the tab.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}