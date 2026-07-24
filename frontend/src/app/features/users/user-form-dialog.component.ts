import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import type { User } from '../../core/models/user.model';

/**
 * Create/Edit user dialog.
 *
 * On CREATE the password is required; on EDIT it is optional — leaving it blank
 * keeps the existing password. This is why the password validators are applied
 * conditionally rather than hard-coded.
 */
@Component({
  selector: 'app-user-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit user' : 'New user' }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="form-body">
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" />
          @if (form.controls.email.hasError('required')) {
            <mat-error>Email is required</mat-error>
          } @else if (form.controls.email.hasError('email')) {
            <mat-error>Enter a valid email</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ isEdit ? 'New password (optional)' : 'Password' }}</mat-label>
          <input
            matInput
            [type]="hide() ? 'password' : 'text'"
            formControlName="password"
          />
          <button type="button" mat-icon-button matSuffix (click)="hide.set(!hide())">
            <mat-icon>{{ hide() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (form.controls.password.hasError('required')) {
            <mat-error>Password is required</mat-error>
          } @else if (form.controls.password.hasError('minlength')) {
            <mat-error>Password must be at least 8 characters</mat-error>
          }
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button type="button" mat-button [mat-dialog-close]="undefined">Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="submitting()">
          @if (submitting()) {
            <mat-spinner diameter="20" />
          } @else {
            {{ isEdit ? 'Save' : 'Create' }}
          }
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .form-body { display: flex; flex-direction: column; gap: 0.25rem; min-width: min(380px, 80vw); }
  `,
})
export class UserFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(UserService);
  private readonly notify = inject(NotificationService);
  readonly dialogRef = inject<MatDialogRef<UserFormDialogComponent, User>>(MatDialogRef);
  readonly data = inject<User | undefined>(MAT_DIALOG_DATA);

  readonly isEdit = !!this.data;
  readonly submitting = signal(false);
  readonly hide = signal(true);

  readonly form = this.fb.nonNullable.group({
    email: [this.data?.email ?? '', [Validators.required, Validators.email]],
    password: [
      '',
      // Required only when creating; on edit it's an optional change.
      this.data ? [Validators.minLength(8)] : [Validators.required, Validators.minLength(8)],
    ],
  });

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const { email, password } = this.form.getRawValue();

    const request$ = this.isEdit
      ? this.service.update(this.data!.id, {
          email,
          // Only send a password when the field was filled in.
          ...(password ? { password } : {}),
        })
      : this.service.create({ email, password });

    request$.pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: (user) => {
        this.notify.success(`User ${this.isEdit ? 'updated' : 'created'}`);
        this.dialogRef.close(user);
      },
      error: () => undefined,
    });
  }
}
