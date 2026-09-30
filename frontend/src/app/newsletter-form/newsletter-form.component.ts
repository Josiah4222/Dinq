import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { SubmissionsService } from '../core/submissions.service';
import { SubmittableForm } from '../core/submittable-form';

/**
 * Insights Newsletter signup (form spec Section 13 / 12.3 — Email* validated,
 * submit label "Subscribe").
 *
 * Posts to the Django API, which stores the address as a `NewsletterSubscriber`.
 * The email column is unique, so submitting twice updates the existing row and
 * still succeeds — a double-click never shows the visitor an error.
 *
 * ---------------------------------------------------------------------------
 * PRIORITY FLAG (master doc: lower priority)
 * ---------------------------------------------------------------------------
 * Confirm with stakeholders whether this ships at launch or is deferred to a
 * later phase. It is embedded on the /insights page but is fully self-contained
 * (component + local success state), so deferring it means deleting one tag —
 * nothing else depends on it. Records land in the same staff screen as the
 * other two forms, so a decision to defer affects only the newsletter tab.
 * ---------------------------------------------------------------------------
 */
@Component({
  selector: 'app-newsletter-form',
  imports: [ReactiveFormsModule],
  templateUrl: './newsletter-form.component.html',
  styleUrl: './newsletter-form.component.scss',
})
export class NewsletterFormComponent extends SubmittableForm {
  private readonly fb = inject(FormBuilder);
  private readonly submissions = inject(SubmissionsService);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  /** Whether a submit was attempted (drives inline validation). */
  attempted = false;

  /** True once subscribed — swaps the form for a success message. */
  subscribed = false;

  /** True when the address was already on the list, so the copy can differ. */
  readonly alreadySubscribed = signal(false);

  onSubmit(): void {
    this.attempted = true;
    if (!this.form.valid) {
      this.form.controls.email.markAsTouched();
      return;
    }

    this.beginSubmit();

    this.submissions.subscribeNewsletter(this.form.getRawValue().email).subscribe({
      next: (res) => {
        this.endSubmit();
        this.alreadySubscribed.set(res.alreadySubscribed === true);
        this.subscribed = true;
      },
      error: (err: HttpErrorResponse) => {
        this.failSubmit(err, 'Something went wrong. Please try again.');
      },
    });
  }
}
