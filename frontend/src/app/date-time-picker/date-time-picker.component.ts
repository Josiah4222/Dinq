import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Preferred Date/Time picker — placeholder for the calendar/scheduler embed.
 *
 * Currently wraps the native `datetime-local` input so the form flow works end
 * to end. TODO(integration): swap in the chosen calendar/scheduler embed
 * (e.g. Calendly-style widget) while keeping this ControlValueAccessor contract.
 */
@Component({
  selector: 'app-date-time-picker',
  imports: [],
  templateUrl: './date-time-picker.component.html',
  styleUrl: './date-time-picker.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateTimePickerComponent),
      multi: true,
    },
  ],
})
export class DateTimePickerComponent implements ControlValueAccessor {
  @Input() id = 'preferred-date';
  @Input() label = 'Preferred Date & Time';
  @Input() required = false;

  value = '';
  disabled = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }

  /** Called from the template on blur so validation state updates. */
  markTouched(): void {
    this.onTouched();
  }

  onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.value = raw;
    this.onChange(raw);
    this.markTouched();
  }
}
