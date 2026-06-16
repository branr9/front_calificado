import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Protege las rutas que requieren sesión iniciada.
 * Si no hay usuario autenticado, redirige a /login.
 */
export const authGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.parseUrl('/login');
  }

  const permissions = (route.data?.['permissions'] ?? []) as string[];
  if (permissions.length > 0 && !authService.hasAnyPermission(permissions)) {
    return router.parseUrl('/dashboard');
  }

  return true;
};
