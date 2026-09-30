import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
  type ElementRef,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TOPIC_GROUPS, InquiryTopicsService, type InquiryTopicGroup } from '../core/inquiry-topics.service';
import { SubmissionsService } from '../core/submissions.service';
import { SubmittableForm } from '../core/submittable-form';

/**
 * Quick Inquiry — the short, low-friction enquiry form.
 *
 * Deliberately smaller than the /contact consultation form: a visitor who wants
 * to be contacted gives a name and one way to reach them, picks any topics that
 * apply, and is done. The longer form stays available and is linked from here
 * for anyone who needs to say more, so this does not replace it.
 *
 * Topics come from the CMS so the offered list can change without a deploy, with
 * the shipped defaults standing in until it answers. The labels are what get
 * submitted, since a topic id means nothing to whoever reads the enquiry.
 *
 * Extends SubmittableForm rather than CmsPage: the page copy is fixed here, and
 * that base class is what every other form in the app extends for its submit and
 * validation state.
 */
@Component({
  selector: 'app-quick-inquiry',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './quick-inquiry.component.html',
  styleUrl: './quick-inquiry.component.scss',
})
export class QuickInquiryComponent extends SubmittableForm {
  private readonly fb = inject(FormBuilder);
  private readonly submissions = inject(SubmissionsService);
  private readonly topicsService = inject(InquiryTopicsService);
  private readonly injector = inject(Injector);

  /** The two columns, in the order they are rendered. */
  readonly groups = TOPIC_GROUPS;

  /** The heading each column is listed under. */
  readonly groupLabels: Record<InquiryTopicGroup, string> = {
    canadian: 'Canadian',
    ethiopia: 'Ethiopia',
  };

  /** The topics offered in each column, defaults until the CMS answers. */
  readonly topics = this.topicsService.list;

  /** Ticked topic ids. Keyed by id so a refetch cannot drop a choice silently. */
  readonly selected = signal<Record<string, boolean>>({});

  /** True once a submit has been attempted, so errors show before any blur. */
  quickAttempted = false;

  /** True while the success panel has replaced the form. */
  quickSubmitted = false;

  /** The visitor's first name, kept so it survives the form being torn down. */
  readonly quickSuccessName = signal('');

  /** The reference the API returns, so the enquiry can be quoted. */
  readonly quickReference = signal<string | null>(null);

  /* The template is the only place that knows which input is which control, so
     the focus targets are resolved here by the same names the template uses. */
  private readonly nameInput = viewChild<ElementRef<HTMLInputElement>>('quickName');
  private readonly phoneInput = viewChild<ElementRef<HTMLInputElement>>('quickPhone');
  private readonly emailInput = viewChild<ElementRef<HTMLInputElement>>('quickEmail');
  private readonly successPanel = viewChild<ElementRef<HTMLElement>>('quickSuccess');

  readonly quickForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: [''],
    email: ['', [Validators.email]],
    // Required rather than assumed. The short form still stores someone's details
    // and gets them emailed back, so it needs the same explicit agreement the
    // /contact form asks for; the only thing dropped here is the length of the
    // form, not the consent.
    consent: [false, [Validators.requiredTrue]],
  });

  /**
   * True when there is no way to reply.
   *
   * A quick inquiry is a request to be contacted, so a name on its own is not
   * enough. This is a getter rather than a validator because it is a rule about
   * the pair of fields, which no single control can express, and the server's
   * answer stays the one that decides whether the enquiry was stored.
   */
  get quickContactMissing(): boolean {
    const { phone, email } = this.quickForm.getRawValue();
    return !phone.trim() && !email.trim();
  }

  /** Whether to show the "we need one of these" message. */
  readonly showContactPrompt = computed(() => this.quickAttempted && this.quickContactMissing);

  constructor() {
    super();
    this.topicsService.refresh();
  }

  /** Whether a topic is ticked. */
  isSelected(id: string): boolean {
    return this.selected()[id] === true;
  }

  /**
   * Record a tick in the map.
   *
   * The topics are a set of independent checkboxes rather than a named form
   * group, so they are tracked in a signal keyed by topic id instead of as a
   * FormArray. The ids come from the CMS and the labels are what get submitted.
   */
  toggleTopic(id: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selected.update(current => ({ ...current, [id]: input.checked }));
  }

  /** How many topics are ticked, for the summary line. */
  readonly selectedCount = computed(() =>
    Object.values(this.selected()).filter(Boolean).length,
  );

  /**
   * The ids of the ticked topics, in rendered order.
   *
   * Read off `topics()` rather than the ticked map alone so a tick on a topic
   * that has since been retired from the list is not sent: the server would drop
   * it as unknown anyway, and the enquiry is cleaner for it.
   */
  private selectedIds(): string[] {
    const state = this.selected();
    return this.topics()
      .filter(topic => state[topic.id] === true)
      .map(topic => topic.id);
  }

  onSubmit(): void {
    this.quickAttempted = true;
    this.markAllTouched(this.quickForm);

    if (this.quickForm.invalid || this.quickContactMissing) {
      this.focusFirstProblem();
      return;
    }


    this.beginSubmit();
    const raw = this.quickForm.getRawValue();

    this.submissions
      .submitQuickInquiry({
        name: raw.name.trim(),
        phone: raw.phone.trim(),
        email: raw.email.trim(),
        // Topic ids, not labels: the server resolves them, so renaming a topic
        // does not rewrite what past enquiries said they were about.
        topics: this.selectedIds(),
        consent: raw.consent,
      })
      .subscribe({
        next: (res) => {
          this.endSubmit();
          this.quickSuccessName.set(raw.name.trim().split(/\s+/)[0] ?? '');
          this.quickReference.set(res.reference ?? null);
          this.quickSubmitted = true;
          this.focusSuccess();
        },
        error: (err: HttpErrorResponse) => {
          this.failSubmit(err, 'Something went wrong sending your inquiry. Please try again.');
        },
      });
  }

  /** Back to a blank form with nothing ticked. */
  reset(): void {
    this.quickForm.reset();
    this.selected.set({});
    this.quickAttempted = false;
    this.quickSubmitted = false;
    this.quickSuccessName.set('');
    this.quickReference.set(null);
    this.clearSubmitState();
  }

  /**
   * Move focus to the first thing that needs attention.
   *
   * Without this the focus is left sitting on the button that was just pressed,
   * so a keyboard or screen-reader user is told nothing happened at all.
   */
  private focusFirstProblem(): void {
    const target = this.quickForm.controls.name.invalid
      ? this.nameInput()
      : this.quickForm.controls.email.invalid
        ? this.emailInput()
        : // Reached only when the pair is empty, so the phone is the one to fill.
          this.phoneInput();
    target?.nativeElement.focus();
  }

  /**
   * Hand focus to the success panel.
   *
   * The panel replaces the form, so the focused button goes with it and focus
   * would fall back to the body, leaving the confirmation announced to nobody.
   * `afterNextRender` is the point where the panel exists and the browser will
   * really move focus to it.
   */
  private focusSuccess(): void {
    afterNextRender(
      () => this.successPanel()?.nativeElement.focus(),
      { injector: this.injector },
    );
  }
}
