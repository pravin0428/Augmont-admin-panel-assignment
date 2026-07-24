import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
} from '../components/confirm-dialog/confirm-dialog.component';

/**
 * Opens the reusable confirm dialog and emits the user's choice.
 * Wrapping MatDialog here keeps callers to a single `confirm({...})` call.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly dialog = inject(MatDialog);

  confirm(data: ConfirmDialogData): Observable<boolean> {
    return this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '420px',
        data,
      })
      .afterClosed()
      .pipe(map((result) => result === true));
  }
}
