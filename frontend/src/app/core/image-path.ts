/**
 * Turning a stored image path into something an `<img src>` can actually load.
 *
 * The site stores image paths as plain strings in content blocks. Uploading writes
 * them as `/media/uploads/2026/09/hero-1a2b3c4d.jpg` — absolute, so it resolves
 * the same on every route. But a stored value can also arrive from somewhere else:
 * the hand-written seed copy, the extractor, or a staff member typing a path by
 * hand into the editor. Those are relative (`assets/images/hero.jpg`), and a
 * relative `src` is resolved by the browser against the current URL, so the same
 * string that works on the homepage 404s on `/about`.
 *
 * This normalises those cases at the point of rendering rather than trusting every
 * stored value to already be correct. It is deliberately a pure function over a
 * string, so it can be unit tested without a browser - see
 * `tools/verify-image-paths.mjs`.
 */

/**
 * The `accept` filter for a file input, matching the formats the server keeps.
 * Duplicated here rather than imported from the upload service so the constant
 * sits with the rest of the image rules and both sides can be compared at a
 * glance; the backend list is in `cms/image_upload.py`.
 */
export const ACCEPTED_UPLOAD_TYPES = 'image/jpeg,image/png,image/webp,image/avif';

/**
 * True for a value the browser should fetch as-is.
 *
 * Absolute URLs, protocol-relative ones, and data URIs are all left alone: they
 * already carry everything they need, and rewriting one would break it.
 */
function isAlreadyAbsolute(value: string): boolean {
  return (
    value.startsWith('/') ||
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('//') ||
    value.startsWith('data:') ||
    value.startsWith('blob:')
  );
}

/**
 * Normalise one stored image value for use as an `src`.
 *
 * Returns an empty string for anything unusable, so a caller binding the result
 * to `[src]` renders nothing rather than a broken-image icon. The cases that are
 * refused rather than "fixed" are the ones where guessing would be worse than
 * rendering nothing: a `javascript:` URL is a script injection vector, and a path
 * that walks above the root (`../../etc/passwd`) is not something to serve a
 * guess at.
 */
export function imageSrc(value: string | null | undefined): string {
  const text = (value ?? '').trim();
  if (!text) {
    return '';
  }

  // A javascript: URL is not a URL at all, and must never reach an `src`. The
  // check is on the lowercased text because browsers ignore case in the scheme,
  // so `JavaScript:` would slip past a case-sensitive test.
  if (text.toLowerCase().startsWith('javascript:')) {
    return '';
  }

  if (isAlreadyAbsolute(text)) {
    // Everything else that is already absolute is used verbatim: the browser
    // needs it exactly as stored.
    return text;
  }

  // A relative path. A leading `./` is a no-op, and walking above the root is
  // refused rather than resolved.
  const withoutDot = text.startsWith('./') ? text.slice(2) : text;
  if (withoutDot.split('/').includes('..')) {
    return '';
  }

  return `/${withoutDot}`;
}

/**
 * Whether a stored value is a local file we could replace, as opposed to a remote
 * URL. Used by the editor to decide what to offer: a remote image can be kept as
 * a URL, but only a local one has a file behind it to inspect.
 */
export function isLocalImage(value: string | null | undefined): boolean {
  const text = (value ?? '').trim();
  if (!text) {
    return false;
  }
  return !text.startsWith('http://') && !text.startsWith('https://') && !text.startsWith('//');
}

/**
 * The filename from a stored path, for showing a human-readable label in the
 * editor. Falls back to the whole value when there is no filename to find.
 */
export function imageName(value: string | null | undefined): string {
  const text = (value ?? '').trim();
  if (!text) {
    return '';
  }
  const withoutQuery = text.split(/[?#]/)[0];
  const segments = withoutQuery.split('/').filter(Boolean);
  return segments.length ? segments[segments.length - 1] : text;
}
