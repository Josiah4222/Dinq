import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RevealDirective } from '../reveal.directive';
import { DateTimePickerComponent } from '../date-time-picker/date-time-picker.component';

/** Shared label for the five solutions (used by both the Solutions section and this form). */
export const SOLUTION_OPTIONS = [
  'International Business & Investment Advisory',
  'Diaspora Advisory',
  'Property & Asset Management',
  'Government & Institutional Advisory',
  'HR Related Services',
] as const;

/**
 * Contact / Book a Consultation — two-column section.
 * Left: contact details / office info. Right: a tabbed card holding both
 * Reactive Forms with a CSS cross-fade between tabs.
 *
 * TODO(integration): submission is stubbed — wire both forms to the backend
 * (email/CRM) and replace the inline success state with the real handler.
 */
@Component({
  selector: 'app-contact-section',
  imports: [ReactiveFormsModule, RevealDirective, DateTimePickerComponent],
  templateUrl: './contact-section.component.html',
  styleUrl: './contact-section.component.scss',
})
export class ContactSectionComponent {
  readonly solutions = SOLUTION_OPTIONS;

  readonly clientTypes = ['Investor', 'Diaspora', 'Institution / Government', 'Other'];

  readonly inquiryTypes = ['General Inquiry', 'Partnership', 'Media', 'Other'];

  /** Which tab is shown. 'booking' | 'contact' */
  activeTab: 'booking' | 'contact' = 'booking';

  /** Which form currently shows its success state. null = no form submitted. */
  submitted: 'booking' | 'contact' | null = null;

  /** Whether a submit was attempted (drives the areas-of-interest error). */
  bookingAttempted = false;
  contactAttempted = false;

  private readonly fb = inject(FormBuilder);

  readonly bookingForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    country: [''],
    clientType: ['', [Validators.required]],
    areasOfInterest: this.fb.array(
      this.solutions.map(() => this.fb.control(false, { nonNullable: true }))
    ),
    preferredDate: [''],
    details: [''],
    consent: [false, [Validators.requiredTrue]],
  });

  readonly contactForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    company: [''],
    inquiryType: ['', [Validators.required]],
    message: ['', [Validators.required, Validators.minLength(10)]],
    consent: [false, [Validators.requiredTrue]],
  });

  /** Accessor for the multi-select areas of interest FormArray. */
  get areasArray(): FormArray<FormControl<boolean>> {
    return this.bookingForm.controls.areasOfInterest;
  }

  /** True when at least one area of interest is selected (for validation display). */
  get hasAreaSelected(): boolean {
    return this.areasArray.controls.some((c) => c.value);
  }

  /** Selected area labels, for the success message. */
  get selectedAreas(): string[] {
    return this.solutions.filter((_, i) => this.areasArray.controls[i].value);
  }

  selectTab(tab: 'booking' | 'contact'): void {
    this.activeTab = tab;
    // Reset success state when the user switches tabs so the fresh form shows.
    this.submitted = null;
    if (tab === 'booking') {
      this.contactAttempted = false;
    } else {
      this.bookingAttempted = false;
    }
  }

  onSubmitBooking(): void {
    this.bookingAttempted = true;
    if (!this.bookingForm.valid || !this.hasAreaSelected) {
      this.markAllTouched(this.bookingForm);
      return;
    }
    // TODO(integration): submit `this.bookingForm.getRawValue()` to backend/email.
    this.submitted = 'booking';
  }

  onSubmitContact(): void {
    this.contactAttempted = true;
    if (!this.contactForm.valid) {
      this.markAllTouched(this.contactForm);
      return;
    }
    // TODO(integration): submit `this.contactForm.getRawValue()` to backend/email.
    this.submitted = 'contact';
  }

  resetBooking(): void {
    this.bookingForm.reset();
    this.bookingAttempted = false;
    this.submitted = null;
  }

  resetContact(): void {
    this.contactForm.reset();
    this.contactAttempted = false;
    this.submitted = null;
  }

  private markAllTouched(form: { controls: Record<string, unknown> }): void {
    Object.values(form.controls).forEach((control) => {
      if (control instanceof FormControl) {
        control.markAsTouched();
      }
    });
  }

  /** First validation message for a control, or null when valid. */
  errorMessage(control: FormControl<unknown> | undefined): string | null {
    if (!control || !control.touched || control.valid) {
      return null;
    }
    if (control.hasError('required') || control.hasError('requiredTrue')) {
      return 'This field is required.';
    }
    if (control.hasError('email')) {
      return 'Please enter a valid email address.';
    }
    if (control.hasError('minlength')) {
      return 'Please provide a little more detail.';
    }
    return null;
  }
}
