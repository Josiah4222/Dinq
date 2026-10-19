/**
 * The person each contact card is about.
 *
 * The card itself is one component; what differs between Abel, Ida, and Habtamu
 * is the copy it starts with and the CMS page layered over it, so that is what
 * is described here rather than three near-identical components. A route passes
 * one of these keys as its `person` data, and the component looks it up.
 *
 * Every value below is the fallback: the card renders it when the CMS has
 * nothing to say, and `core/vcard.ts` builds the saved file from the same
 * numbers, so the two cannot disagree. Staff edit the live values under
 * /admin/pages; nothing here is read at runtime except as that fallback.
 */

/** One phone number as the card starts with it, before any CMS edit. */
export interface VcardPhoneLine {
  /** The number exactly as it should be read back, and dialled from. */
  value: string;
  /** Shown above the number. Empty means no label — never invented here. */
  label: string;
  /**
   * Whether the number is a mobile line rather than a voice-only one.
   *
   * It is not rendered differently; it is what the saved vCard carries as
   * `TYPE=CELL`, which is what makes a phone offer the number for SMS and
   * WhatsApp as well as calls.
   */
  mobile: boolean;
}

/** Everything that makes one card that card. */
export interface VcardPerson {
  /** Route segment: `/vcard/abel-giratta` is `abel-giratta`. */
  slug: string;
  /** CMS page watched for edits. Always `vcard-` plus the slug. */
  cmsSlug: string;
  /** First name, used in the copy around the save button. */
  firstName: string;
  /** Full name as the card shows it. */
  name: string;
  role: string;
  org: string;
  /** Portrait path, or empty for the monogram. */
  image: string;
  location: string;
  /**
   * Primary number first. One or two lines, because the editor offers exactly
   * two phone fields — a third would need a field on both sides rather than a
   * longer list here.
   */
  phones: readonly [VcardPhoneLine] | readonly [VcardPhoneLine, VcardPhoneLine];
  email: string;
}

/**
 * The CMS keys a phone line is read from, in order.
 *
 * The card is limited to the two fields the editor offers. A third line would
 * need a field added on both sides rather than a longer list here.
 */
export const PHONE_KEYS = [
  { value: 'contact.phonePrimary', label: 'contact.phonePrimaryLabel' },
  { value: 'contact.phoneSecondary', label: 'contact.phoneSecondaryLabel' },
] as const;

/** The people with a card, keyed by route segment. */
export const VCARD_PEOPLE: Readonly<Record<string, VcardPerson>> = {
  'abel-giratta': {
    slug: 'abel-giratta',
    cmsSlug: 'vcard-abel-giratta',
    firstName: 'Abel',
    name: 'Abel M. Giratta',
    role: 'Founder & Managing Director',
    org: 'Dinq Advisory Group',
    image: '/media/assets/images/Abel.jpg',
    location: 'Addis Ababa, Ethiopia',
    phones: [
      { value: '+251979893117', label: '', mobile: true },
      { value: '+14168997000', label: '', mobile: true },
    ],
    email: 'abel@dinqadvisory.com',
  },
  'ida-edo': {
    slug: 'ida-edo',
    cmsSlug: 'vcard-ida-edo',
    firstName: 'Ida',
    name: 'Ida Edo',
    role: 'Director, Workforce & Organizational Advisory',
    org: 'Dinq Advisory Group',
    image: '',
    location: 'Addis Ababa, Ethiopia',
    phones: [
      { value: '+251979890688', label: '', mobile: true },
      { value: '+14168997000', label: '', mobile: true },
    ],
    email: 'ida@dinqadvisory.com',
  },
  'habtamu-bazezew': {
    slug: 'habtamu-bazezew',
    cmsSlug: 'vcard-habtamu-bazezew',
    firstName: 'Habtamu',
    name: 'Habtamu Bazezew',
    role: 'Partner & Legal Strategy Advisor',
    org: 'Dinq Advisory Group',
    image: '/media/assets/images/habtamu.jpg',
    location: 'Addis Ababa, Ethiopia',
    phones: [
      { value: '+251911485407', label: '', mobile: true },
      { value: '+251952064444', label: '', mobile: true },
    ],
    email: 'habtamu@dinqadvisory.com',
  },
};
