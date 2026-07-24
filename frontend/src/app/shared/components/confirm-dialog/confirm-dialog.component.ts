import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

/** Data contract for the reusable confirmation dialog. */
export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** 'warn' renders a red confirm button for destructive actions. */
  confirmColor?: 'primary' | 'warn';
}

/**
 * A single reusable confirmation dialog used everywhere we perform a
 * destructive/irreversible action (delete user, category, product).
 *
 * WHY reusable (not one dialog per feature): the interaction is identical each
 * time — only the copy changes. One component = consistent UX + zero duplication.
 * It returns `true`/`false` via the dialog ref so callers just check the result.
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(false)">
        {{ data.cancelText ?? 'Cancel' }}
      </button>
      <button
        mat-flat-button
        [color]="data.confirmColor ?? 'primary'"
        (click)="dialogRef.close(true)"
      >
        {{ data.confirmText ?? 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  readonly dialogRef = inject<MatDialogRef<ConfirmDialogComponent, boolean>>(MatDialogRef);
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
