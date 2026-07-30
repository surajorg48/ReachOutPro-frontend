import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, finalize, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  User,
  AuthTokens,
  LoginResponse,
  RegisterRequest,
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly baseUrl = environment.apiUrl;
  private readonly ACCESS_TOKEN_KEY = 'rap_access_token';
  private readonly REFRESH_TOKEN_KEY = 'rap_refresh_token';
  private readonly USER_KEY = 'rap_user';

  private userSignal = signal<User | null>(this.loadStoredUser());
  private refreshInProgress: Observable<AuthTokens | null> | null = null;

  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.userSignal());
  readonly userRole = computed(() => this.userSignal()?.role ?? null);
  readonly orgId = computed(() => this.userSignal()?.orgId ?? null);

  register(data: RegisterRequest): Observable<{ email: string; message: string }> {
    return this.http.post<{ email: string; message: string }>(
      `${this.baseUrl}/auth/register`,
      data,
    );
  }

  sendOtp(
    email: string,
    purpose: 'login' | 'registration' = 'login',
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/auth/send-otp`, {
      email,
      purpose,
    });
  }

  verifyOtp(email: string, code: string, purpose: 'login' | 'registration' = 'login'): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/auth/verify-otp`, { email, code, purpose })
      .pipe(tap((res) => this.handleAuthResponse(res)));
  }

  refreshTokens(): Observable<AuthTokens | null> {
    if (this.refreshInProgress) {
      return this.refreshInProgress;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return of(null);

    const request$ = this.http
      .post<{ tokens: AuthTokens }>(`${this.baseUrl}/auth/refresh`, { refreshToken })
      .pipe(
        map((res) => res.tokens),
        tap((tokens) => {
          this.storeTokens(tokens);
        }),
        catchError(() => {
          this.clearAuth();
          return of(null);
        }),
        finalize(() => {
          this.refreshInProgress = null;
        }),
      );

    this.refreshInProgress = request$;
    return request$;
  }

  logout(): Observable<{ message: string }> {
    const refreshToken = this.getRefreshToken();
    return this.http
      .post<{ message: string }>(`${this.baseUrl}/auth/logout`, { refreshToken })
      .pipe(
        tap(() => {
          this.clearAuth();
          this.router.navigate(['/auth/login']);
        }),
        catchError(() => {
          this.clearAuth();
          this.router.navigate(['/auth/login']);
          return of({ message: 'Logged out' });
        }),
      );
  }

  getMe(): Observable<User | null> {
    return this.http.get<User>(`${this.baseUrl}/auth/me`).pipe(
      tap((user) => {
        this.userSignal.set(user);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      }),
      catchError(() => {
        this.clearAuth();
        return of(null);
      }),
    );
  }

  hasRole(minRole: string): boolean {
    const user = this.userSignal();
    if (!user) return false;
    const hierarchy: Record<string, number> = {
      super_admin: 100,
      admin: 80,
      manager: 60,
      recruiter: 40,
      viewer: 20,
    };
    return (hierarchy[user.role] ?? 0) >= (hierarchy[minRole] ?? 0);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private handleAuthResponse(res: LoginResponse): void {
    this.storeTokens(res.tokens);
    this.userSignal.set(res.user);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
  }

  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  private clearAuth(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.userSignal.set(null);
  }

  private loadStoredUser(): User | null {
    try {
      const stored = localStorage.getItem(this.USER_KEY);
      const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
      if (stored && token) {
        return JSON.parse(stored);
      }
    } catch {}
    return null;
  }
}
