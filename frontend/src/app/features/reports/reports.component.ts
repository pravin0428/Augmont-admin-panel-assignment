import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { ReportService } from '../../core/services/report.service';
import { CategoryService } from '../../core/services/category.service';
import { NotificationService } from '../../core/services/notification.service';
import type { Category } from '../../core/models/category.model';
import type { ReportFilter } from '../../core/models/import.model';

/**
 * Reports page: choose a format + filters and download a streamed product
 * report. The download itself is handled as a Blob (see ReportService) so large
 * exports never materialise as a giant in-memory string.
 */
@Component({
  selector: 'app-reports',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly reportService = inject(ReportService);
  private readonly categoryService = inject(CategoryService);
  private readonly notify = inject(NotificationService);

  readonly categories = signal<Category[]>([]);
  readonly downloading = signal(false);

  readonly form = this.fb.nonNullable.group({
    format: ['csv' as 'csv' | 'xlsx'],
    search: [''],
    categoryId: [null as number | null],
    minPrice: [null as number | null],
    maxPrice: [null as number | null],
  });

  ngOnInit(): void {
    this.categoryService.list().subscribe((categories) => this.categories.set(categories));
  }

  download(): void {
    if (this.downloading()) return;
    this.downloading.set(true);

    const raw = this.form.getRawValue();
    const filter: ReportFilter = {
      format: raw.format,
      ...(raw.search.trim() ? { search: raw.search.trim() } : {}),
      ...(raw.categoryId != null ? { categoryId: raw.categoryId } : {}),
      ...(raw.minPrice != null ? { minPrice: raw.minPrice } : {}),
      ...(raw.maxPrice != null ? { maxPrice: raw.maxPrice } : {}),
    };

    this.reportService
      .download(filter)
      .pipe(finalize(() => this.downloading.set(false)))
      .subscribe({
        next: (blob) => {
          const stamp = new Date().toISOString().slice(0, 10);
          this.reportService.saveBlob(blob, `products-report-${stamp}.${filter.format}`);
          this.notify.success('Report downloaded');
        },
        error: () => undefined,
      });
  }
}
