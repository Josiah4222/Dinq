import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { SubmissionsService } from '../core/submissions.service';
import { SubmittableForm } from '../core/submittable-form';

/**
 * Property & Asset Management lead-capture form.
 *
 * Embedded only on /solutions/property-asset-management via a slug gate in the
 * SolutionDetail template. Mirrors ContactComponent's pattern: FormBuilder
 * reactive form, shared `.form-*` classes from styles.scss, and a POST to the
 * Django API which stores it as a `PropertyLeadSubmission` — a separate model
 * from general Contact submissions so the two can be triaged independently.
 */
@Component({
  selector: 'app-property-lead-form',
  imports: [ReactiveFormsModule],
  templateUrl: './property-lead-form.component.html',
  styleUrl: './property-lead-form.component.scss',
})
export class PropertyLeadFormComponent extends SubmittableForm {
  /** Current location / country options. */
  readonly locationOptions = [
    'Ethiopia',
    'Canada',
    'United States',
    'United Kingdom',
    'Europe',
    'Middle East',
    'Other',
  ];

  /** Property interest options. */
  readonly propertyInterestOptions = [
    'Buying',
    'Managing an Existing Property',
    'Both',
  ];

  /** Whether the form currently shows its success state. */
  submitted = false;

  readonly reference = signal<string | null>(null);

  private readonly fb = inject(FormBuilder);
  private readonly submissions = inject(SubmissionsService);

  readonly leadForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    location: ['', [Validators.required]],
    propertyInterest: ['', [Validators.required]],
    message: [''],
    consent: [false, [Validators.requiredTrue]],
  });

  onSubmit(): void {
    if (!this.leadForm.valid) {
      this.markAllTouched(this.leadForm);
      return;
    }

    this.beginSubmit();

    this.submissions.submitPropertyLead(this.leadForm.getRawValue()).subscribe({
      next: (res) => {
        this.endSubmit();
        this.reference.set(res.reference ?? null);
        this.submitted = true;
      },
      error: (err: HttpErrorResponse) => {
        this.failSubmit(err, 'Something went wrong sending your enquiry. Please try again.');
      },
    });
  }

  reset(): void {
    this.leadForm.reset();
    this.submitted = false;
    this.reference.set(null);
    this.clearSubmitState();
  }
}
