import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../config/environment';

export type UserRole = 'ADMINISTRADOR' | 'FUNCIONARIO';

export interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
  user?: {
    id: number;
    username: string;
    email?: string;
    nombreCompleto?: string;
    rol: UserRole;
  };
  usuario?: {
    id: number;
    username: string;
    email?: string;
    nombreCompleto?: string;
    rol: UserRole;
  };
  rol?: UserRole;
  username?: string;
  nombreCompleto?: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email?: string;
  nombreCompleto?: string;
  rol: UserRole;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenSignal = signal<string | null>(null);
  private userSignal = signal<AuthUser | null>(null);

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.userSignal());

  private readonly tokenStorageKey = 'rc_token';
  private readonly userStorageKey = 'rc_user';
  private readonly loginEndpoint = `${environment.apiUrl}/api/auth/login`;

  constructor() {
    this.restoreSession();
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

    const role = userFromPayload?.rol ?? response.rol;
    if (!role) {
      throw new Error('La respuesta de autenticacion no incluye rol.');
    }

    const user: AuthUser = {
      id: userFromPayload?.id ?? 0,
      username: userFromPayload?.username ?? response.username ?? '',
      email: userFromPayload?.email,
      nombreCompleto: userFromPayload?.nombreCompleto ?? response.nombreCompleto,
      rol: role
    };

    if (!user.username) {
      throw new Error('La respuesta de autenticacion no incluye username.');
    }

    return { token, user };
  }

  private persistSession(token: string | null, user: AuthUser): void {
    this.tokenSignal.set(token);
    this.userSignal.set(user);

    if (token) {
      localStorage.setItem(this.tokenStorageKey, token);
    } else {
      localStorage.removeItem(this.tokenStorageKey);
    }

    localStorage.setItem(this.userStorageKey, JSON.stringify(user));
  }

  private restoreSession(): void {
    const storedUser = localStorage.getItem(this.userStorageKey);
    if (!storedUser) {
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser) as AuthUser;
      this.userSignal.set(parsedUser);
      this.tokenSignal.set(localStorage.getItem(this.tokenStorageKey));
    } catch {
      this.clearSession();
    }
  }

  private clearSession(): void {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    localStorage.removeItem(this.tokenStorageKey);
    localStorage.removeItem(this.userStorageKey);
  }
}
