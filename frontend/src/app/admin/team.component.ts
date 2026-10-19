import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StaffUser, StaffUsersService } from '../core/staff-users.service';
import { AdminShellComponent } from './admin-shell.component';

/**
 * /admin/team — where a superuser adds another administrator.
 *
 * The list and the create form share one screen on purpose: before minting a
 * new account it is worth seeing who already has access. The server is the
 * authority on both (it rejects non-superusers and returns per-field errors),
 * so this component only mirrors that rule in the UI.
 */
@Component({
  selector: 'app-team',
  imports: [FormsModule, AdminShellComponent],
  templateUrl: './team.component.html',
  styleUrl: './team.component.scss',
})
export class TeamComponent implements OnInit {
  private readonly staffUsers = inject(StaffUsersService);

  readonly users = signal<StaffUser[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  // ---- Create form -------------------------------------------------------
  readonly username = signal('');
  readonly firstName = signal('');
  readonly lastName = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly isSuperuser = signal(false);
  readonly showPassword = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly fieldErrors = signal<Record<string, string[]>>({});
  readonly invalidFields = signal<Record<string, boolean>>({});

  ngOnInit(): void {
    this.loadUsers();
  }

  togglePassword(): void {
    this.showPassword.update(visible => !visible);
  }

  create(): void {
    if (this.saving()) {
      return;
    }

    const username = this.username().trim();
    const password = this.password();

    this.fieldErrors.set({});
    this.invalidFields.set({
      username: username.length === 0,
      password: password.length === 0,
    });
    this.formError.set(null);
    this.success.set(null);

    if (!username) {
      this.formError.set('Enter a username for the new account.');
      return;
    }
    if (!password) {
      this.formError.set('Enter a password for the new account.');
      return;
    }

    this.saving.set(true);

    this.staffUsers
      .create({
        username,
        email: this.email().trim(),
        firstName: this.firstName().trim(),
        lastName: this.lastName().trim(),
        password,
        isSuperuser: this.isSuperuser(),
      })
      .subscribe({
        next: res => {
          this.saving.set(false);
          this.users.update(list =>
            [...list, res.user].sort((a, b) =>
              a.username.localeCompare(b.username)
            )
          );
          this.success.set(`Added ${res.user.username}.`);
          this.resetForm();
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          const errors = (err.error as { errors?: Record<string, string[]> } | null)
            ?.errors;
          if (errors) {
            this.fieldErrors.set(errors);
            const invalid: Record<string, boolean> = {};
            for (const key of Object.keys(errors)) {
              invalid[key] = true;
            }
            this.invalidFields.set(invalid);
            this.formError.set('Please correct the highlighted fields.');
            return;
          }
          this.formError.set(this.describe(err));
        },
      });
  }

  /** First message for a field, or null. */
  fieldError(name: string): string | null {
    const errors = this.fieldErrors()[name];
    return errors && errors.length > 0 ? errors[0] : null;
  }

  /** The person's name, falling back to their username. */
  displayName(user: StaffUser): string {
    const full = [user.firstName, user.lastName].filter(Boolean).join(' ');
    return full || user.username;
  }

  roleLabel(user: StaffUser): string {
    return user.isSuperuser ? 'Superuser' : 'Staff';
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.staffUsers.list().subscribe({
      next: res => {
        this.users.set(res.results);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.loadError.set(this.describe(err));
      },
    });
  }

  private resetForm(): void {
    this.username.set('');
    this.firstName.set('');
    this.lastName.set('');
    this.email.set('');
    this.password.set('');
    this.isSuperuser.set(false);
    this.fieldErrors.set({});
    this.invalidFields.set({});
  }

  /** Turn a failed response into one readable line. */
  private describe(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return 'Cannot reach the server. Check that the backend is running.';
    }

    const body = err.error as { detail?: string } | null;
    if (body && typeof body.detail === 'string') {
      return body.detail;
    }

    if (err.status === 403) {
      const raw = typeof err.error === 'string' ? err.error : '';
      if (raw.includes('CSRF')) {
        return 'Security check failed. Refresh the page and try again.';
      }
      return 'Only a superuser can manage staff accounts.';
    }

    return 'Something went wrong. Please try again.';
  }
}
