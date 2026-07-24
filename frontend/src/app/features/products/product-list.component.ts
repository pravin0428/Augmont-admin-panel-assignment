import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { MatSortModule, type Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import {
  ProductFormDialogComponent,
  type ProductDialogData,
} from './product-form-dialog.component';
import type { Category } from '../../core/models/category.model';
import type { Product, ProductListParams, ProductSortField } from '../../core/models/product.model';

/**
 * Products page. All list operations are SERVER-SIDE (the table is a dumb view
 * of one page of results): pagination, sorting, search and category filtering
 * all translate to query params and a fresh request. This scales to millions of
 * rows because the browser only ever holds one page.
 *
 * Search is debounced (350ms) via a FormControl + switchMap so we don't fire a
 * request per keystroke and stale responses are cancelled.
 */
@Component({
  selector: 'app-product-list',
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly notify = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = ['image', 'name', 'price', 'category', 'createdAt', 'actions'];

  readonly products = signal<Product[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly categories = signal<Category[]>([]);

  readonly searchControl = new FormControl('', { nonNullable: true });

  /** Mutable query state; every change funnels through `load()`. */
  private params: ProductListParams = {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    order: 'desc',
  };

  /** Paginator bindings derived from the current query state. */
  get pageIndex(): number {
    return this.params.page - 1;
  }
  get pageSize(): number {
    return this.params.limit;
  }

  ngOnInit(): void {
    this.categoryService.list().subscribe((categories) => this.categories.set(categories));

    // Debounced, cancellable search: switchMap drops the previous in-flight
    // request when a new keystroke arrives, avoiding race conditions.
    this.searchControl.valueChanges
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((term) => {
          this.params = { ...this.params, page: 1, search: term.trim() || undefined };
          this.loading.set(true);
          return this.productService.list(this.params);
        }),
      )
      .subscribe({
        next: (result) => {
          this.products.set(result.data);
          this.total.set(result.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });

    this.load();
  }

  onCategoryFilter(categoryId: number | null): void {
    this.params = { ...this.params, page: 1, categoryId: categoryId ?? undefined };
    this.load();
  }

  onPage(event: PageEvent): void {
    this.params = { ...this.params, page: event.pageIndex + 1, limit: event.pageSize };
    this.load();
  }

  onSort(sort: Sort): void {
    // Empty direction means "unsorted" — fall back to the default ordering.
    if (!sort.direction) {
      this.params = { ...this.params, sortBy: 'createdAt', order: 'desc' };
    } else {
      this.params = {
        ...this.params,
        sortBy: sort.active as ProductSortField,
        order: sort.direction,
      };
    }
    this.load();
  }

  openCreate(): void {
    this.openDialog();
  }

  openEdit(product: Product): void {
    this.openDialog(product);
  }

  delete(product: Product): void {
    this.confirm
      .confirm({
        title: 'Delete product',
        message: `Delete "${product.name}"? This cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.productService.remove(product.id).subscribe(() => {
          this.notify.success('Product deleted');
          this.load();
        });
      });
  }

  imageUrl(path: string | null): string | null {
    return this.productService.imageUrl(path);
  }

  private openDialog(product?: Product): void {
    const data: ProductDialogData = product
      ? { product, categories: this.categories() }
      : { categories: this.categories() };

    this.dialog
      .open<ProductFormDialogComponent, ProductDialogData, Product>(ProductFormDialogComponent, {
        width: '520px',
        data,
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.load();
      });
  }

  private load(): void {
    this.loading.set(true);
    this.productService.list(this.params).subscribe({
      next: (result) => {
        this.products.set(result.data);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
