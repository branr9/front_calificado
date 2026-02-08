import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../config/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Solo agregar autenticación a peticiones del API
  if (req.url.includes('/api/')) {
    const authHeader = 'Basic ' + btoa(`${environment.auth.username}:${environment.auth.password}`);
    
    const authReq = req.clone({
      setHeaders: {
        Authorization: authHeader
      }
    });
    
    return next(authReq);
  }
  
  // Para otras peticiones, continuar sin modificar
  return next(req);
};
