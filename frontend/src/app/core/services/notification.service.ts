import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Thin wrapper over MatSnackBar so components emit user feedback with one call
 * and consistent styling/duration. Centralising this means we can change toast
 * behaviour app-wide in one place (DRY).
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 3000,
      panelClass: ['snackbar-success'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      panelClass: ['snackbar-error'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
