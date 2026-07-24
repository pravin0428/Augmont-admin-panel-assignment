import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { finalize } from 'rxjs';
import { UploadService } from '../../core/services/upload.service';
import { NotificationService } from '../../core/services/notification.service';
import type { ImportSummary } from '../../core/models/import.model';

const ACCEPTED_EXT = ['.csv', '.xlsx'];

/**
 * Bulk upload page. Streams a CSV/XLSX to the backend and renders the import
 * summary (inserted / failed / duration + per-row failure reasons).
 *
 * We show UPLOAD progress via the UploadService's event stream so a large file
 * gives visible feedback instead of an apparently frozen page.
 */
@Component({
  selector: 'app-bulk-upload',
  imports: [
    DecimalPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    MatListModule,
  ],
  templateUrl: './bulk-upload.component.html',
  styleUrl: './bulk-upload.component.scss',
})
export class BulkUploadComponent {
  private readonly uploadService = inject(UploadService);
  private readonly notify = inject(NotificationService);

  readonly selectedFile = signal<File | null>(null);
  readonly uploading = signal(false);
  readonly progress = signal(0);
  readonly summary = signal<ImportSummary | null>(null);
  readonly failureColumns = ['row', 'reason'];

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file && !ACCEPTED_EXT.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      this.notify.error('Please choose a .csv or .xlsx file');
      return;
    }
    this.selectedFile.set(file);
    this.summary.set(null);
  }

  upload(): void {
    const file = this.selectedFile();
    if (!file || this.uploading()) return;

    this.uploading.set(true);
    this.progress.set(0);
    this.summary.set(null);

    this.uploadService
      .importProducts(file)
      .pipe(finalize(() => this.uploading.set(false)))
      .subscribe({
        next: (event) => {
          if (event.type === 'progress') {
            this.progress.set(event.percent);
          } else {
            this.summary.set(event.summary);
            this.notify.success(
              `Imported ${event.summary.inserted} of ${event.summary.totalRecords} rows`,
            );
          }
        },
        error: () => undefined,
      });
  }

  reset(): void {
    this.selectedFile.set(null);
    this.summary.set(null);
    this.progress.set(0);
  }
}
