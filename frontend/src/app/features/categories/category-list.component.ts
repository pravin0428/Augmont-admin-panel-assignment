import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { CategoryService } from '../../core/services/category.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import { CategoryFormDialogComponent } from './category-form-dialog.component';
import type { Category } from '../../core/models/category.model';

/**
 * Categories page. The dataset is small (dozens, not millions), so we load the
 * full list once and render it — server-side pagination would be premature here.
 * Contrast with Products, which is paginated because it can be unbounded.
 */
@Component({
  selector: 'app-category-list',
  imports: [DatePipe, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss',
})
export class CategoryListComponent implements OnInit {
  private readonly service = inject(CategoryService);
  private readonly notify = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = ['name', 'uniqueId', 'createdAt', 'actions'];
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);

  ngOnInit(): void {
    this.load();
  }

  openCreate(): void {
    this.openDialog();
  }

  openEdit(category: Category): void {
    this.openDialog(category);
  }

  delete(category: Category): void {
    this.confirm
      .confirm({
        title: 'Delete category',
        message: `Delete "${category.name}"? Categories with products cannot be deleted.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.service.remove(category.id).subscribe(() => {
          this.notify.success('Category deleted');
          this.load();
        });
      });
  }

  private openDialog(category?: Category): void {
    this.dialog
      .open<CategoryFormDialogComponent, Category | undefined, Category>(
        CategoryFormDialogComponent,
        { width: '400px', data: category },
      )
      .afterClosed()
      .subscribe((result) => {
        if (result) this.load();
      });
  }

  private load(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
