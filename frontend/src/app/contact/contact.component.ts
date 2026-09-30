import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { RevealDirective } from '../reveal.directive';
import { DateTimePickerComponent } from '../date-time-picker/date-time-picker.component';
import { SubmissionsService } from '../core/submissions.service';
import { SubmittableForm } from '../core/submittable-form';
import { PageContentService, PageValues } from '../core/page-content.service';

/** The five service lines, used by the area-of-interest chips. */
const SOLUTION_OPTIONS = [
  'International Business & Investment Advisory',
  'Diaspora Advisory',
  'Property & Asset Management',
  'Government & Institutional Advisory',
  'Workforce & Organizational Advisory',
] as const;

/**
 * Contact — dedicated page holding the unified "Book a Consultation / Contact"
 * form. Rendered at the /contact route and linked from the homepage CTAs and
 * site nav.
 *
 * The page's own copy — the heading, the intro, and the direct contact details —
 * is read from the `contact` page in the CMS and layered over the values below,
 * which are the shipped copy and the fallback for every key. The form itself
 * is not editable: its labels, options and validation belong to the form
 * contract, and changing them from a text box would desynchronise the payload
 * the API expects.
 *
 * This component extends SubmittableForm rather than CmsPage, because it already
 * has a base class to extend and TypeScript has only one; the watch/release
 * plumbing below is the same two lines CmsPage centralises for the other pages.
 *
 * Submits to the Django API, which stores the enquiry in `submissions` and
 * re-validates every field server-side. The browser validation is a convenience
 * for the visitor; the server's answer is the one that decides whether the
 * enquiry was saved.
 */
@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, RevealDirective, DateTimePickerComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent extends SubmittableForm implements OnInit, OnDestroy {
  private readonly content = inject(PageContentService);

  /** Current page content. Empty until the request resolves, and on any failure. */
  private readonly values = signal<PageValues | null>(null);

  /** Released on destroy, which is what tells PageContentService to stop polling. */
  private watch?: Subscription;

  readonly solutions = SOLUTION_OPTIONS;

  readonly clientTypes = ['Investor', 'Diaspora', 'Institution / Government', 'Other'];

  readonly reasonOptions = ['General Inquiry', 'Partnership', 'Media', 'Other'];

  /* ---- Page copy ------------------------------------------------------------ */
  readonly heroEyebrow = computed(() => this.content.text(this.values(), 'hero.eyebrow', 'Get in Touch'));
  readonly heroTitle = computed(() =>
    this.content.text(
      this.values(),
      'hero.title',
      'Let’s Discuss What You’re Building, Investing In, or Managing in Ethiopia.',
    ),
  );
  readonly heroIntro = computed(() =>
    this.content.text(
      this.values(),
      'hero.intro',
      'Whether you are evaluating an investment, entering the Ethiopian market, managing property from abroad, or coordinating a complex institutional mandate, Dinq can help you define the next practical step.',
    ),
  );

  /* ---- Direct contact details ---------------------------------------------- */
  readonly emailLabel = computed(() => this.content.text(this.values(), 'details.emailLabel', 'Email'));
  readonly phoneLabel = computed(() => this.content.text(this.values(), 'details.phoneLabel', 'Phone'));
  readonly addressLabel = computed(() => this.content.text(this.values(), 'details.addressLabel', 'Address'));
  readonly email = computed(() => this.content.text(this.values(), 'details.email', 'info@dinqadvisory.com'));
  readonly phone = computed(() => this.content.text(this.values(), 'details.phone', '416-899-7000'));
  readonly addressLine1 = computed(() => this.content.text(this.values(), 'details.addressLine1', '40 Wynford Drive, Suite 208,'));
  readonly addressLine2 = computed(() => this.content.text(this.values(), 'details.addressLine2', 'Toronto, ON, Canada M3C 1J5'));

  /*
   * A second office, listed under its own name. The Canada entries above keep
   * their original keys, so an editor who has already customised the page is not
   * left with a blank office.
   */
  readonly canadaLabel = computed(() => this.content.text(this.values(), 'details.canadaLabel', 'Canada'));
  readonly ethiopiaLabel = computed(() => this.content.text(this.values(), 'details.ethiopiaLabel', 'Ethiopia'));
  readonly ethiopiaPhone = computed(() => this.content.text(this.values(), 'details.ethiopiaPhone', '+251 952 064 444'));
  readonly ethiopiaAddress = computed(() => this.content.text(this.values(), 'details.ethiopiaAddress', 'Addis Ababa, Ethiopia'));

  /* ---- Confirmation --------------------------------------------------------- */
  readonly successTitle = computed(() => this.content.text(this.values(), 'success.title', 'Request received.'));
  readonly successReference = computed(() => this.content.text(this.values(), 'success.reference', 'Your reference is'));
  readonly successResetCta = computed(() => this.content.text(this.values(), 'success.resetCta', 'Send another message'));

  /** Whether the form currently shows its success state. */
  submitted = false;

  /** The reference the server returns, shown on the success state. */
  readonly reference = signal<string | null>(null);

  private readonly fb = inject(FormBuilder);
  private readonly submissions = inject(SubmissionsService);

  readonly contactForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    country: [''],
    company: [''],
    clientType: ['', [Validators.required]],
    reasonForContact: ['', [Validators.required]],
    areasOfInterest: this.fb.array(
      this.solutions.map(() => this.fb.control(false, { nonNullable: true }))
    ),
    preferredDate: [''],
    message: ['', [Validators.required, Validators.minLength(10)]],
    consent: [false, [Validators.requiredTrue]],
  });

  /** Accessor for the multi-select areas of interest FormArray. */
  get areasArray(): FormArray<FormControl<boolean>> {
    return this.contactForm.controls.areasOfInterest;
  }

  ngOnInit(): void {
    this.watch = this.content.watch('contact').subscribe(values => this.values.set(values));
  }

  ngOnDestroy(): void {
    this.watch?.unsubscribe();
  }

  onSubmit(): void {
    if (!this.contactForm.valid) {
      this.markAllTouched(this.contactForm);
      return;
    }

    this.beginSubmit();

    this.submissions.submitContact(this.buildPayload()).subscribe({
      next: (res) => {
        this.endSubmit();
        this.reference.set(res.reference ?? null);
        this.submitted = true;
      },
      error: (err: HttpErrorResponse) => {
        this.failSubmit(err, 'Something went wrong sending your message. Please try again.');
      },
    });
  }

  /**
   * Flatten the form into the API's shape.
   *
   * The areas-of-interest FormArray is positional booleans against
   * `SOLUTION_OPTIONS`; the API wants the names of the ticked ones, so the
   * mapping happens here rather than in the backend.
   */
  private buildPayload(): Record<string, unknown> {
    const raw = this.contactForm.getRawValue();
    const ticked: string[] = [];

    raw.areasOfInterest.forEach((selected, index) => {
      if (selected) {
        ticked.push(this.solutions[index]);
      }
    });

    return {
      ...raw,
      areasOfInterest: ticked,
    };
  }

  reset(): void {
    this.contactForm.reset();
    this.submitted = false;
    this.reference.set(null);
    this.clearSubmitState();
  }
}
