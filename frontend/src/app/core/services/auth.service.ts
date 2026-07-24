import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiSuccess } from '../models/api.model';
import type { AuthResult, AuthUser, Credentials } from '../models/auth.model';

const TOKEN_STORAGE_KEY = 'pms.auth.token';
const USER_STORAGE_KEY = 'pms.auth.user';

/**
 * Authentication state + API.
 *
 * WHY Signals for session state: the navbar, route guard, and pages all need to
 * react to "am I logged in?". A signal is a simple, synchronous reactive source
 * that templates read directly (no async pipe, no manual subscriptions) — the
 * right tool for small shared UI state. We reserve RxJS for the HTTP calls
 * themselves (streams with cancellation/retry semantics).
 *
 * The token is persisted in localStorage so a refresh keeps the session; the
 * JWT interceptor reads it for outgoing requests.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  // Private writable signals; exposed as readonly to prevent external mutation.
  private readonly tokenSig = signal<string | null>(this.readToken());
  private readonly userSig = signal<AuthUser | null>(this.readUser());

  readonly currentUser = this.userSig.asReadonly();
  readonly isAuthenticated = computed(() => this.tokenSig() !== null);

  /** Synchronous token accessor for the HTTP interceptor. */
  get token(): string | null {
    return this.tokenSig();
  }

  login(credentials: Credentials): Observable<AuthUser> {
    return this.http
      .post<ApiSuccess<AuthResult>>(`${this.baseUrl}/login`, credentials)
      .pipe(
        map((res) => res.data),
        tap((result) => this.persistSession(result)),
        map((result) => result.user),
      );
  }

  register(credentials: Credentials): Observable<AuthUser> {
    return this.http
      .post<ApiSuccess<AuthResult>>(`${this.baseUrl}/register`, credentials)
      .pipe(
        map((res) => res.data),
        tap((result) => this.persistSession(result)),
        map((result) => result.user),
      );
  }

  logout(): void {
    this.tokenSig.set(null);
    this.userSig.set(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  private persistSession(result: AuthResult): void {
    this.tokenSig.set(result.token);
    this.userSig.set(result.user);
    localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
  }

  private readToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  private readUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
