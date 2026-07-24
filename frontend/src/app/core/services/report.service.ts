import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ReportFilter } from '../models/import.model';

/**
 * Report download client.
 *
 * WHY responseType 'blob': the endpoint streams a file (CSV/XLSX), not JSON. We
 * receive it as a Blob and trigger a browser "Save As" via an object URL. This
 * keeps the whole download in the browser's streaming path — the file is never
 * turned into a giant JS string.
 */
@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reports`;

  download(filter: ReportFilter): Observable<Blob> {
    let params = new HttpParams().set('format', filter.format);
    if (filter.search) params = params.set('search', filter.search);
    if (filter.categoryId != null) params = params.set('categoryId', filter.categoryId);
    if (filter.minPrice != null) params = params.set('minPrice', filter.minPrice);
    if (filter.maxPrice != null) params = params.set('maxPrice', filter.maxPrice);

    return this.http.get(`${this.baseUrl}/products`, { params, responseType: 'blob' });
  }

  /** Trigger a browser download for a received blob. */
  saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    // Release the object URL to avoid leaking memory.
    URL.revokeObjectURL(url);
  }
}
