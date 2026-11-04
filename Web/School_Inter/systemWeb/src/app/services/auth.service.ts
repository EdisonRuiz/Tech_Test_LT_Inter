import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL, LoginRequest, LoginResponse } from '../types/api.types';

const TOKEN_STORAGE_KEY = 'school_inter_jwt_token';
const USER_STORAGE_KEY = 'school_inter_user_info';

export interface AuthUser {
  id?: string;
  email: string;
  fullName?: string;
  role?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly token = signal<string | null>(this.readStoredToken());
  readonly currentUser = signal<AuthUser | null>(this.readStoredUser());

  readonly isAuthenticated = computed(() => {
    const rawToken = this.token();
    if (!rawToken) {
      return false;
    }
    return !this.isTokenExpired(rawToken);
  });

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_BASE_URL}/api/auth/login`, payload).pipe(
      tap((response) => {
        const extractedToken = this.extractToken(response);
        if (extractedToken) {
          this.setSession(extractedToken, payload.Email, response);
        }
      })
    );
  }

  setSession(rawToken: string, fallbackEmail?: string, response?: LoginResponse): void {
    const cleanToken = this.sanitizeBearerToken(rawToken);
    if (!cleanToken) {
      return;
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, cleanToken);
    this.token.set(cleanToken);

    const claims = this.decodeJwtClaims(cleanToken);
    const user: AuthUser = {
      id:
        response?.studentId ||
        response?.user?.id ||
        (claims['sub'] as string) ||
        (claims['nameid'] as string) ||
        (claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] as string),
      email:
        response?.email ||
        response?.user?.email ||
        (claims['email'] as string) ||
        (claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] as string) ||
        fallbackEmail ||
        'estudiante@campus.edu',
      fullName:
        response?.fullName ||
        response?.user?.fullName ||
        (claims['name'] as string) ||
        (claims['unique_name'] as string) ||
        (claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] as string),
      role:
        response?.user?.role ||
        (claims['role'] as string) ||
        (claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as string),
    };

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  getToken(): string | null {
    const current = this.token();
    if (!current) {
      return null;
    }
    if (this.isTokenExpired(current)) {
      this.clearSession();
      return null;
    }
    return this.sanitizeBearerToken(current);
  }

  logout(redirectToLogin = true): void {
    this.clearSession();
    if (redirectToLogin) {
      void this.router.navigate(['/login']);
    }
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    this.token.set(null);
    this.currentUser.set(null);
  }

  sanitizeBearerToken(token: string): string {
    return token.replace(/^Bearer\s+/i, '').trim();
  }

  private extractToken(response: LoginResponse | string | null | undefined): string | null {
    if (!response) {
      return null;
    }
    if (typeof response === 'string') {
      return this.sanitizeBearerToken(response);
    }

    const candidates = [
      response.token,
      response.accessToken,
      response.jwt,
      (response as Record<string, unknown>)['Token'] as string | undefined,
      (response as Record<string, unknown>)['AccessToken'] as string | undefined,
      ((response as Record<string, unknown>)['data'] as Record<string, unknown> | undefined)?.[
        'token'
      ] as string | undefined,
    ];

    const found = candidates.find((item) => typeof item === 'string' && item.trim().length > 0);
    return found ? this.sanitizeBearerToken(found) : null;
  }

  private readStoredToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const clean = this.sanitizeBearerToken(raw);
    if (this.isTokenExpired(clean)) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }
    return clean;
  }

  private readStoredUser(): AuthUser | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  private decodeJwtClaims(token: string): Record<string, unknown> {
    try {
      const parts = token.split('.');
      if (parts.length < 2) {
        return {};
      }
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
      const decoded = atob(padded);
      return JSON.parse(decoded) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  private isTokenExpired(token: string): boolean {
    const claims = this.decodeJwtClaims(token);
    const exp = claims['exp'];
    if (typeof exp !== 'number') {
      return false;
    }
    const nowSeconds = Math.floor(Date.now() / 1000);
    return exp <= nowSeconds;
  }
}
