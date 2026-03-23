import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { environment } from '../config/environment';

export type UserRole = string;

export interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
  tokenType?: string;
  permisos?: string[];
  user?: {
    id: number;
    username: string;
    email?: string;
    nombreCompleto?: string;
    rol: UserRole;
    permisos?: string[];
  };
  usuario?: {
    id: number;
    username: string;
    email?: string;
    nombreCompleto?: string;
    rol: UserRole;
    permisos?: string[];
  };
  rol?: UserRole;
  username?: string;
  email?: string;
  nombreCompleto?: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email?: string;
  nombreCompleto?: string;
  rol: UserRole;
  permisos?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private tokenSignal = signal<string | null>(null);
  private userSignal = signal<AuthUser | null>(null);

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.userSignal());

  private readonly tokenStorageKey = 'rc_token';
  private readonly userStorageKey = 'rc_user';
  private readonly loginEndpoint = `${environment.apiUrl}/api/auth/login` || '/api/auth/login';

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.restoreSession();
    }
  }

  login(credentials: LoginRequest): Observable<void> {
    return this.http.post<LoginResponse>(this.loginEndpoint, credentials).pipe(
      map((response) => this.normalizeAuth(response)),
      tap(({ token, user }) => {
        this.persistSession(token, user);
        this.router.navigate(['/dashboard']);
      }),
      map(() => void 0)
    );
  }

  hasRole(role: UserRole): boolean {
    return this.userSignal()?.rol === role;
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private normalizeAuth(response: LoginResponse): { token: string | null; user: AuthUser } {
    const token = response.token ?? response.accessToken ?? response.jwt ?? null;

    const userFromPayload = response.user ?? response.usuario;
    const roleFromPayload = userFromPayload?.rol ?? response.rol;
    const usernameFromPayload = userFromPayload?.username ?? response.username;
    const emailFromPayload = userFromPayload?.email ?? response.email;
    const permisosFromPayload = userFromPayload?.permisos ?? response.permisos;

    if (!roleFromPayload) {
      throw new Error('La respuesta de autenticación no incluye rol.');
    }

    if (!usernameFromPayload) {
      throw new Error('La respuesta de autenticación no incluye username.');
    }

    const user: AuthUser = {
      id: userFromPayload?.id ?? 0,
      username: usernameFromPayload,
      email: emailFromPayload,
      nombreCompleto: userFromPayload?.nombreCompleto ?? response.nombreCompleto,
      rol: roleFromPayload,
      permisos: permisosFromPayload
    };

    return { token, user };
  }

  private persistSession(token: string | null, user: AuthUser): void {
    this.tokenSignal.set(token);
    this.userSignal.set(user);

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (token) {
      localStorage.setItem(this.tokenStorageKey, token);
    } else {
      localStorage.removeItem(this.tokenStorageKey);
    }

    localStorage.setItem(this.userStorageKey, JSON.stringify(user));
  }

  private restoreSession(): void {
    const storedToken = localStorage.getItem(this.tokenStorageKey);
    const storedUser = localStorage.getItem(this.userStorageKey);

    if (!storedUser || !storedToken) {
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser) as AuthUser;
      this.userSignal.set(parsedUser);
      this.tokenSignal.set(storedToken);
    } catch {
      this.clearSession();
    }
  }

  private clearSession(): void {
    this.tokenSignal.set(null);
    this.userSignal.set(null);

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.removeItem(this.tokenStorageKey);
    localStorage.removeItem(this.userStorageKey);
  }
}
