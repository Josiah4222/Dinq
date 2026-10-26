import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RevealDirective } from '../reveal.directive';
import { CmsPage } from '../core/cms-page';
import { ImageSrcPipe } from '../core/image-src.pipe';
import { ImageSrcsetPipe } from '../core/image-variants.pipe';
import { VCardContact, VCardPhone, mailHref, saveVCard, telHref } from '../core/vcard';
import { PHONE_KEYS, VCARD_PEOPLE, VcardPerson } from './vcard-person';

/** One phone number as the card draws it: the number as typed, and what to dial. */
interface CardPhone {
  display: string;
  href: string;
  label: string;
}

/**
 * A contact card at /vcard/:person — one component, one route per person.
 *
 * The page exists to be forwarded. Someone who meets Ida, Habtamu, or Abel on a
 * call, at an event, or through Dinq sends this link, and the recipient ends up
 * with their number and email in their own phone rather than a screenshot they
 * have to type out by hand.
 *
 * Which person the card is about comes from the route's `person` data and is
 * looked up in `vcard-person.ts`. The copy is not written here: everything the
 * card shows is read from that person's CMS page and layered over the shipped
 * values, which are the fallback for every key. Staff correct a number or swap
 * the email under /admin/pages and the change reaches this tab without a reload
 * — including in the file a visitor saves, because the vCard is assembled from
 * the same values the page renders (see `core/vcard.ts`).
 *
 * The single most important thing on the page is the save button, so it is the
 * one action rendered as a real control rather than a link: on a phone it opens
 * the contact importer, which is the whole point of the page. Calling and
 * emailing sit beside it as links, because those are hand-offs to another app and
 * there is nothing to save about them.
 *
 * Nothing here is invented: no phone number carries a label that staff have not
 * confirmed, and the role and organisation are the ones the leadership page
 * already carries.
 */
@Component({
  selector: 'app-vcard',
  imports: [RevealDirective, ImageSrcPipe, ImageSrcsetPipe],
  templateUrl: './vcard.component.html',
  styleUrl: './vcard.component.scss',
})
export class VcardComponent extends CmsPage implements OnInit {
  /** The person this route is for. Fixed for the life of the component. */
  readonly person: VcardPerson = resolvePerson(inject(ActivatedRoute).snapshot.data);

  /**
   * Set for a moment after the card is saved.
   *
   * A tap on "Save Contact" on iOS and Android leaves no trace on the page — the
   * contact importer takes over the screen — so a visitor who cancels it comes
   * back to a button that looks exactly as it did before and cannot tell whether
   * anything happened. This confirms it for them.
   */
  readonly saved = signal(false);

  /** The pending confirmation timer, released on destroy. */
  private savedTimer: ReturnType<typeof setTimeout> | null = null;

  /* ---- Card --------------------------------------------------------------- */
  readonly name = computed(() => this.content.text(this.values(), 'card.name', this.person.name));
  readonly role = computed(() => this.content.text(this.values(), 'card.role', this.person.role));
  readonly org = computed(() => this.content.text(this.values(), 'card.org', this.person.org));
  readonly portrait = computed(() => this.content.text(this.values(), 'card.image', this.person.image));
  readonly location = computed(() =>
    this.content.text(this.values(), 'card.location', this.person.location),
  );

  /** The initial shown in place of the portrait if one is not set. */
  readonly initial = computed(() => this.name().trim().charAt(0).toUpperCase() || 'A');

  /* ---- Contact ------------------------------------------------------------ */

  /**
   * The numbers as stored, before anything is displayed or dialled.
   *
   * Held separately from `phones` because the mobile flag is not something the
   * page renders but is something the saved file needs: a number typed CELL is
   * the one a phone offers for SMS and WhatsApp rather than calls alone.
   *
   * Each line falls back to the number shipped in `vcard-person.ts`. The second
   * slot is deliberately left empty for anyone who has only one number, so the
   * card lists what exists and the CMS field stays available for an editor to
   * add another rather than a number being published in code.
   */
  private readonly storedPhones = computed<VCardPhone[]>(() =>
    this.person.phones
      .map((line, index) => ({
        value: this.content.text(this.values(), PHONE_KEYS[index].value, line.value),
        label: this.content.text(this.values(), PHONE_KEYS[index].label, line.label),
        mobile: line.mobile,
      }))
      .filter(phone => /[+0-9]/.test(phone.value)),
  );

  /**
   * The numbers to offer, in the order they should be read.
   *
   * An empty field produces no row rather than a button that rings nobody: a
   * number staff have not filled in yet should not look like a way to reach
   * this person. The number is shown exactly as it was stored, so the digits on
   * the page are the digits the visitor reads back to themselves.
   */
  readonly phones = computed<CardPhone[]>(() =>
    this.storedPhones().map(phone => ({
      display: phone.value,
      href: telHref(phone.value),
      label: phone.label ?? '',
    })),
  );

  readonly email = computed(() =>
    this.content.text(this.values(), 'contact.email', this.person.email),
  );
  readonly emailHref = computed(() => mailHref(this.email()));

  /**
   * The LinkedIn link, or null.
   *
   * Refused rather than linked unless it is an http(s) URL: this is the one
   * address on the card nobody has vetted yet, and an editor pasting a profile
   * name into the field must not turn it into a dead link on a client's card.
   */
  readonly linkedinHref = computed(() => {
    const raw = this.content.text(this.values(), 'contact.linkedin', '').trim();
    return /^https?:\/\/\S+$/i.test(raw) ? raw : null;
  });

  /* ---- Buttons ------------------------------------------------------------ */
  readonly saveLabel = computed(() => this.content.text(this.values(), 'action.saveLabel', 'Save Contact'));
  readonly saveHint = computed(() =>
    this.content.text(
      this.values(),
      'action.saveHint',
      `Saves to your phone's contacts, with the number and the email address, so you can reach ${this.person.firstName} without this page open.`,
    ),
  );
  readonly callLabel = computed(() => this.content.text(this.values(), 'action.callLabel', 'Call'));
  readonly emailLabel = computed(() => this.content.text(this.values(), 'action.emailLabel', 'Email'));

  /** Confirmation shown after a save. Not editable: it reports the visitor's own tap. */
  readonly savedLabel = 'Added to your contacts.';

  /**
   * Save the card, then confirm it on screen.
   *
   * The file is built from the values the card is currently showing rather than
   * from anything the server holds, so what lands in the visitor's contacts is
   * exactly what they read. The confirmation is announced politely and clears
   * itself, because it describes a tap that already happened and should not sit
   * on the page afterwards.
   */
  saveContact(): void {
    saveVCard(this.contact(), new Date());

    this.saved.set(true);

    // A second tap replaces the first timer rather than queueing behind it, so
    // the confirmation always clears four seconds after the last tap.
    if (this.savedTimer !== null) {
      clearTimeout(this.savedTimer);
    }
    this.savedTimer = setTimeout(() => {
      this.saved.set(false);
      this.savedTimer = null;
    }, 4000);
  }

  /**
   * The contact the file is built from.
   *
   * The URL is the page's own address rather than a stored one, so the saved
   * contact links back to the live card — and stays correct if the page moves.
   */
  private contact(): VCardContact {
    const pageUrl =
      typeof location === 'undefined' ? '' : `${location.origin}${location.pathname}`;

    return {
      name: this.name(),
      role: this.role(),
      org: this.org(),
      phones: this.storedPhones(),
      email: this.email(),
      url: pageUrl,
    };
  }

  ngOnInit(): void {
    this.bind(this.person.cmsSlug);
  }

  /**
   * Release the confirmation timer on the way out. The superclass stops the
   * content poll, so this has to call through rather than replace it.
   */
  override ngOnDestroy(): void {
    if (this.savedTimer !== null) {
      clearTimeout(this.savedTimer);
      this.savedTimer = null;
    }
    super.ngOnDestroy();
  }
}

/**
 * The person named by a route's `person` data.
 *
 * A route that forgets the data, or names someone who has no card, fails here
 * rather than rendering an empty card with a stranger's CMS page behind it.
 */
function resolvePerson(data: Record<string, unknown>): VcardPerson {
  const key = typeof data['person'] === 'string' ? data['person'] : '';
  const person = VCARD_PEOPLE[key];
  if (!person) {
    throw new Error(`No contact card is defined for "${key}".`);
  }
  return person;
}
