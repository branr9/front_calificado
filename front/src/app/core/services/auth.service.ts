import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private isAuthenticatedSignal = signal<boolean>(false);
  
  readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();

  login(): void {
    this.isAuthenticatedSignal.set(true);
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.isAuthenticatedSignal.set(false);
    this.router.navigate(['/login']);
  }
}
