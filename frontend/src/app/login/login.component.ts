import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BrandLogoComponent } from '../brand-logo/brand-logo.component';
import { AuthService } from '../core/auth.service';

/**
 * /login — staff sign-in for the Dinq site.
 *
 * Posts to the Django API, which sets the session cookie on success. There is no
 * token to store here: the cookie is the session, and `HttpClient` sends it
 * because every call runs with credentials.
 */
@Component({
  selector: 'app-login',
  imports: [FormsModule, BrandLogoComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly username = signal('');
  readonly password = signal('');
  readonly showPassword = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  /** Field-level flags, so the form can mark the right input. */
  readonly usernameInvalid = signal(false);
  readonly passwordInvalid = signal(false);

  readonly year = new Date().getFullYear();

  /** Only same-origin paths, so `returnUrl` cannot be used as an open redirect. */
  private readonly returnUrl: string;

  constructor() {
    const candidate = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/admin';
    this.returnUrl = /^\/(?!\/)/.test(candidate) ? candidate : '/admin';
  }

  togglePassword(): void {
    this.showPassword.update(visible => !visible);
  }

  submit(): void {
    if (this.submitting()) {
      return;
    }

    const username = this.username().trim();
    const password = this.password();

    this.usernameInvalid.set(username.length === 0);
    this.passwordInvalid.set(password.length === 0);
    this.errorMessage.set(null);

    if (!username || !password) {
      return;
    }

    this.submitting.set(true);

    this.auth.login(username, password).subscribe({
      next: () => {
        this.submitting.set(false);
        this.password.set('');
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(this.describe(err));
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
      return 'This account does not have access to the staff area.';
    }

    return 'Something went wrong. Please try again.';
  }
}
