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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { CategoryService } from '../../core/services/category.service';
import { NotificationService } from '../../core/services/notification.service';
import type { Category } from '../../core/models/category.model';

/** Create/Edit category dialog — one form, mode inferred from `data`. */
@Component({
  selector: 'app-category-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit category' : 'New category' }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" cdkFocusInitial />
          @if (form.controls.name.hasError('required')) {
            <mat-error>Name is required</mat-error>
          } @else if (form.controls.name.hasError('minlength')) {
            <mat-error>Name must be at least 2 characters</mat-error>
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
  styles: `.full-width { width: min(360px, 80vw); }`,
})
export class CategoryFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CategoryService);
  private readonly notify = inject(NotificationService);
  readonly dialogRef = inject<MatDialogRef<CategoryFormDialogComponent, Category>>(MatDialogRef);
  readonly data = inject<Category | undefined>(MAT_DIALOG_DATA);

  readonly isEdit = !!this.data;
  readonly submitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: [this.data?.name ?? '', [Validators.required, Validators.minLength(2)]],
  });

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const payload = this.form.getRawValue();

    const request$ = this.isEdit
      ? this.service.update(this.data!.id, payload)
      : this.service.create(payload);

    request$.pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: (category) => {
        this.notify.success(`Category ${this.isEdit ? 'updated' : 'created'}`);
        this.dialogRef.close(category);
      },
      error: () => undefined,
    });
  }
}
