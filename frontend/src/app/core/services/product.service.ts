import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiSuccess, PaginatedResult } from '../models/api.model';
import type { Product, ProductFormValue, ProductListParams } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/products`;

  /** List with server-side pagination/sorting/search/filtering. */
  list(params: ProductListParams): Observable<PaginatedResult<Product>> {
    let httpParams = new HttpParams()
      .set('page', params.page)
      .set('limit', params.limit)
      .set('sortBy', params.sortBy)
      .set('order', params.order);

    // Only attach optional params when set — keeps the URL clean and lets the
    // backend apply its own defaults.
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.categoryId != null) httpParams = httpParams.set('categoryId', params.categoryId);
    if (params.minPrice != null) httpParams = httpParams.set('minPrice', params.minPrice);
    if (params.maxPrice != null) httpParams = httpParams.set('maxPrice', params.maxPrice);

    return this.http
      .get<ApiSuccess<PaginatedResult<Product>>>(this.baseUrl, { params: httpParams })
      .pipe(map((r) => r.data));
  }

  get(id: number): Observable<Product> {
    return this.http.get<ApiSuccess<Product>>(`${this.baseUrl}/${id}`).pipe(map((r) => r.data));
  }

  create(value: ProductFormValue): Observable<Product> {
    return this.http
      .post<ApiSuccess<Product>>(this.baseUrl, this.toFormData(value))
      .pipe(map((r) => r.data));
  }

  update(id: number, value: Partial<ProductFormValue>): Observable<Product> {
    return this.http
      .put<ApiSuccess<Product>>(`${this.baseUrl}/${id}`, this.toFormData(value))
      .pipe(map((r) => r.data));
  }

  remove(id: number): Observable<void> {
    return this.http.delete<ApiSuccess<null>>(`${this.baseUrl}/${id}`).pipe(map(() => undefined));
  }

  /** Resolve a stored relative image path to a fully qualified URL. */
  imageUrl(path: string | null): string | null {
    if (!path) return null;
    return `${environment.assetBaseUrl}/${path}`;
  }

  /**
   * Build multipart/form-data for create/update. WHY FormData: product mutations
   * carry an optional image file, which must be sent as multipart. We do NOT set
   * the Content-Type header ourselves — the browser sets it (with the multipart
   * boundary) automatically for FormData.
   */
  private toFormData(value: Partial<ProductFormValue>): FormData {
    const form = new FormData();
    if (value.name != null) form.append('name', value.name);
    if (value.price != null) form.append('price', String(value.price));
    if (value.categoryId != null) form.append('categoryId', String(value.categoryId));
    if (value.image) form.append('image', value.image);
    return form;
  }
}
