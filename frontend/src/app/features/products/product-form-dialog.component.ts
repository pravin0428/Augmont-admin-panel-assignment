import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { ProductService } from '../../core/services/product.service';
import { NotificationService } from '../../core/services/notification.service';
import type { Category } from '../../core/models/category.model';
import type { Product } from '../../core/models/product.model';

export interface ProductDialogData {
  product?: Product;
  categories: Category[];
}

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB — mirrors the backend limit
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Create/Edit product dialog. One component handles both modes (create vs edit)
 * driven by whether `data.product` is present — same form, no duplication.
 *
 * Image validation is done client-side too (type + size) so the user gets
 * instant feedback; the backend re-validates as the real security boundary.
 */
@Component({
  selector: 'app-product-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './product-form-dialog.component.html',
  styleUrl: './product-form-dialog.component.scss',
})
export class ProductFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProductService);
  private readonly notify = inject(NotificationService);
  readonly dialogRef = inject<MatDialogRef<ProductFormDialogComponent, Product>>(MatDialogRef);
  readonly data = inject<ProductDialogData>(MAT_DIALOG_DATA);

  readonly isEdit = !!this.data.product;
  readonly submitting = signal(false);
  readonly imagePreview = signal<string | null>(
    this.data.product ? this.service.imageUrl(this.data.product.image) : null,
  );
  private selectedFile: File | null = null;

  readonly form = this.fb.nonNullable.group({
    name: [this.data.product?.name ?? '', [Validators.required, Validators.minLength(2)]],
    price: [
      this.data.product?.price ?? 0,
      [Validators.required, Validators.min(0.01)],
    ],
    categoryId: [
      this.data.product?.categoryId ?? (null as number | null),
      [Validators.required],
    ],
  });

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      this.notify.error('Only JPG, PNG, WEBP or GIF images are allowed');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      this.notify.error('Image must be 2 MB or smaller');
      return;
    }

    this.selectedFile = file;
    this.imagePreview.set(URL.createObjectURL(file));
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);

    const raw = this.form.getRawValue();
    const value = {
      name: raw.name,
      price: raw.price,
      categoryId: raw.categoryId as number,
      image: this.selectedFile,
    };

    const request$ = this.isEdit
      ? this.service.update(this.data.product!.id, value)
      : this.service.create(value);

    request$.pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: (product) => {
        this.notify.success(`Product ${this.isEdit ? 'updated' : 'created'} successfully`);
        this.dialogRef.close(product);
      },
      error: () => undefined,
    });
  }
}
