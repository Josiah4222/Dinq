import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FieldErrors } from './submissions.service';

/**
 * Shared submit/validation state for the forms that post to the submissions
 * API. Kept in one place so the contact, property-lead and newsletter forms
 * behave identically: a disabled-while-sending button, one banner above the
 * fields, and field-level messages that prefer the server's answer over the
 * browser's.
 */
export abstract class SubmittableForm {
  /** True while the POST is in flight. */
  readonly sending = signal(false);

  /** One banner above the fields when the whole request failed. */
  readonly serverError = signal<string | null>(null);

  /** Field-level messages from the server, keyed by snake_case field name. */
  readonly serverFieldErrors = signal<FieldErrors>({});

  /** Call just before sending: clears anything left from the last attempt. */
  protected beginSubmit(): void {
    this.sending.set(true);
    this.serverError.set(null);
    this.serverFieldErrors.set({});
  }

  /** Call when the POST resolves: unlocks the form. */
  protected endSubmit(): void {
    this.sending.set(false);
  }

  /**
   * Turn an error response into a banner plus per-field messages.
   *
   * A 400 from the forms is validation, so the messages are attached to the
   * offending fields. Anything else (offline, 500) has no field to blame, so
   * it becomes a single banner.
   */
  protected failSubmit(err: HttpErrorResponse, fallback: string): void {
    this.endSubmit();

    const body = err.error as { errors?: FieldErrors } | null;
    if (body?.errors) {
      this.serverFieldErrors.set(body.errors);
      this.serverError.set('Please check the highlighted fields and try again.');
      return;
    }

    this.serverError.set(err.status === 0 ? 'Cannot reach the server. Please try again in a moment.' : fallback);
  }

  /** Clear everything — used when the visitor resets the form. */
  protected clearSubmitState(): void {
    this.serverError.set(null);
    this.serverFieldErrors.set({});
  }

  protected markAllTouched(form: { controls: Record<string, unknown> }): void {
    Object.values(form.controls).forEach((control) => {
      if (control instanceof FormControl) {
        control.markAsTouched();
      }
    });
  }

  /** First browser-side validation message for a control, or null. */
  protected browserError(control: FormControl<unknown> | undefined): string | null {
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

  /**
   * The message to show for a control: the server's if it sent one, otherwise
   * the browser's. Django reports errors under snake_case keys while the form
   * controls are camelCase, so the name is translated on the way through.
   */
  fieldError(name: string, control: FormControl<unknown> | undefined): string | null {
    const serverMessages = this.serverFieldErrors()[toSnakeCase(name)];
    return serverMessages?.length ? serverMessages[0] : this.browserError(control);
  }
}

/** `fullName` -> `full_name`, matching Django's field names. */
function toSnakeCase(value: string): string {
  return value.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}
