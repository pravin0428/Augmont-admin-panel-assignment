import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

type AuthMode = 'login' | 'register';

/**
 * Login / Register screen.
 *
 * Uses a Reactive Form: the validation model is defined in code (testable,
 * strongly typed) and the template binds to it. The submit button is disabled
 * while invalid or while a request is in flight to prevent double submits.
 */
@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notify = inject(NotificationService);

  readonly mode = signal<AuthMode>('login');
  readonly submitting = signal(false);
  readonly hidePassword = signal(true);

  /** Non-nullable typed form. Validators mirror the backend rules. */
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  toggleMode(): void {
    this.mode.update((m) => (m === 'login' ? 'register' : 'login'));
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const credentials = this.form.getRawValue();
    const request$ =
      this.mode() === 'login'
        ? this.auth.login(credentials)
        : this.auth.register(credentials);

    request$.pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: (user) => {
        this.notify.success(`Welcome, ${user.email}`);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
        void this.router.navigateByUrl(returnUrl);
      },
      // Errors are surfaced globally by the error interceptor.
      error: () => undefined,
    });
  }
}
