import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEventType, type HttpEvent } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiSuccess } from '../models/api.model';
import type { ImportSummary } from '../models/import.model';

/** Discriminated progress/result union emitted while a bulk import runs. */
export type ImportProgress =
  | { type: 'progress'; percent: number }
  | { type: 'done'; summary: ImportSummary };

/**
 * Bulk import client.
 *
 * WHY `reportProgress` + `observe: 'events'`: import files can be large, so we
 * surface UPLOAD progress to the UI (progress bar) rather than leaving the user
 * staring at a frozen screen. The final HttpResponse event carries the summary.
 */
@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/products`;

  importProducts(file: File): Observable<ImportProgress> {
    const form = new FormData();
    form.append('file', file);

    return this.http
      .post<ApiSuccess<ImportSummary>>(`${this.baseUrl}/import`, form, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(map((event) => this.mapEvent(event)));
  }

  private mapEvent(event: HttpEvent<ApiSuccess<ImportSummary>>): ImportProgress {
    if (event.type === HttpEventType.UploadProgress) {
      const percent = event.total ? Math.round((100 * event.loaded) / event.total) : 0;
      return { type: 'progress', percent };
    }
    if (event.type === HttpEventType.Response && event.body) {
      return { type: 'done', summary: event.body.data };
    }
    // Intermediate events (Sent, ResponseHeader, …) map to 0% "still uploading".
    return { type: 'progress', percent: 0 };
  }
}
