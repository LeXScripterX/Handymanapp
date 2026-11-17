import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Llamamos al método del servicio que obtiene el token.
  // Usamos 'from' para convertir la Promesa en un Observable.
  return from(authService.obtenerToken()).pipe(
    switchMap(token => {
      // Si hay token, clonamos la petición y añadimos el header de Autorización
      if (token) {
        const clonedReq = req.clone({
          setHeaders: { Authorization: `Bearer ${token}` }
        });
        return next(clonedReq);
      }
      // Si no hay token (ej. login), dejamos pasar la petición normal
      return next(req);
    })
  );
};