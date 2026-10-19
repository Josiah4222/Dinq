import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { AdminShellComponent } from './admin-shell.component';

/**
 * /admin/account — where a staff member changes their own sign-in details.
 *
 * Two forms, deliberately separate: a rename and a password change are
 * different tasks with different failure modes (a taken username versus a
 * wrong current password), and mixing them into one form would make both
 * blurrier. The password form keeps the user signed in afterwards — Django's
 * session is re-hashed on the server — so a password change is not also a
 * surprise logout.
 */
@Component({
  selector: 'app-account',
  imports: [FormsModule, AdminShellComponent],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss',
})
export class AccountComponent {
  private readonly auth = inject(AuthService);

  // ---- Username form -----------------------------------------------------
  readonly username = signal('');
  readonly savingUsername = signal(false);
  readonly usernameError = signal<string | null>(null);
  readonly usernameSuccess = signal<string | null>(null);
  readonly usernameInvalid = signal(false);

  // ---- Password form -----------------------------------------------------
  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');
  readonly showPassword = signal(false);
  readonly savingPassword = signal(false);
  readonly passwordError = signal<string | null>(null);
  readonly passwordSuccess = signal<string | null>(null);
  readonly currentInvalid = signal(false);
  readonly newInvalid = signal(false);
  readonly confirmInvalid = signal(false);

  readonly displayName = computed(() => this.auth.displayName());

  constructor() {
    this.username.set(this.auth.user()?.username ?? '');
  }

  togglePassword(): void {
    this.showPassword.update(visible => !visible);
  }

  saveUsername(): void {
    if (this.savingUsername()) {
      return;
    }

    const username = this.username().trim();
    this.usernameInvalid.set(username.length === 0);
    this.usernameError.set(null);
    this.usernameSuccess.set(null);

    if (!username) {
      this.usernameError.set('Enter a username.');
      return;
    }

    this.savingUsername.set(true);

    this.auth.updateUsername(username).subscribe({
      next: user => {
        this.savingUsername.set(false);
        this.username.set(user.username);
        this.usernameSuccess.set('Username updated.');
      },
      error: (err: HttpErrorResponse) => {
        this.savingUsername.set(false);
        this.usernameInvalid.set(true);
        this.usernameError.set(this.describe(err));
      },
    });
  }

  savePassword(): void {
    if (this.savingPassword()) {
      return;
    }

    const current = this.currentPassword();
    const next = this.newPassword();
    const confirm = this.confirmPassword();

    this.currentInvalid.set(current.length === 0);
    this.newInvalid.set(next.length === 0);
    this.confirmInvalid.set(next.length === 0 || confirm !== next);
    this.passwordError.set(null);
    this.passwordSuccess.set(null);

    if (!current) {
      this.passwordError.set('Enter your current password.');
      return;
    }
    if (!next) {
      this.passwordError.set('Enter a new password.');
      return;
    }
    if (confirm !== next) {
      this.passwordError.set('The two new passwords do not match.');
      return;
    }

    this.savingPassword.set(true);

    this.auth.changePassword(current, next).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.currentPassword.set('');
        this.newPassword.set('');
        this.confirmPassword.set('');
        this.passwordSuccess.set('Password updated.');
      },
      error: (err: HttpErrorResponse) => {
        this.savingPassword.set(false);
        this.passwordError.set(this.describe(err));
        // The backend names the offending field, so highlight the right box.
        const field = (err.error as { field?: string } | null)?.field;
        this.currentInvalid.set(field === 'currentPassword');
        this.newInvalid.set(field === 'newPassword');
      },
    });
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
      return 'Your session has expired. Sign in again.';
    }

    return 'Something went wrong. Please try again.';
  }
}
