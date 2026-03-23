import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // No agregar token a peticiones que no sean API
  if (!req.url.includes('/api/')) {
    return next(req);
  }

  // No agregar token al endpoint de login
  if (req.url.includes('/api/auth/login')) {
    console.log('🔓 Petición de login sin token');
    return next(req);
  }

  const token = authService.token();
  if (!token) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq);
};
