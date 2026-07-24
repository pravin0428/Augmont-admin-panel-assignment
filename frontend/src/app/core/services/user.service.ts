import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiSuccess } from '../models/api.model';
import type { CreateUserPayload, UpdateUserPayload, User } from '../models/user.model';

/**
 * User API client. Each method unwraps the response envelope to the `data`
 * payload so components work with domain objects, not transport wrappers.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  list(): Observable<User[]> {
    return this.http.get<ApiSuccess<User[]>>(this.baseUrl).pipe(map((r) => r.data));
  }

  get(id: number): Observable<User> {
    return this.http.get<ApiSuccess<User>>(`${this.baseUrl}/${id}`).pipe(map((r) => r.data));
  }

  create(payload: CreateUserPayload): Observable<User> {
    return this.http.post<ApiSuccess<User>>(this.baseUrl, payload).pipe(map((r) => r.data));
  }

  update(id: number, payload: UpdateUserPayload): Observable<User> {
    return this.http
      .put<ApiSuccess<User>>(`${this.baseUrl}/${id}`, payload)
      .pipe(map((r) => r.data));
  }

  remove(id: number): Observable<void> {
    return this.http.delete<ApiSuccess<null>>(`${this.baseUrl}/${id}`).pipe(map(() => undefined));
  }
}
