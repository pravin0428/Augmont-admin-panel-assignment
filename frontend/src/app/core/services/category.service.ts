import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiSuccess } from '../models/api.model';
import type { Category, CategoryPayload } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/categories`;

  list(): Observable<Category[]> {
    return this.http.get<ApiSuccess<Category[]>>(this.baseUrl).pipe(map((r) => r.data));
  }

  create(payload: CategoryPayload): Observable<Category> {
    return this.http.post<ApiSuccess<Category>>(this.baseUrl, payload).pipe(map((r) => r.data));
  }

  update(id: number, payload: CategoryPayload): Observable<Category> {
    return this.http
      .put<ApiSuccess<Category>>(`${this.baseUrl}/${id}`, payload)
      .pipe(map((r) => r.data));
  }

  remove(id: number): Observable<void> {
    return this.http.delete<ApiSuccess<null>>(`${this.baseUrl}/${id}`).pipe(map(() => undefined));
  }
}
