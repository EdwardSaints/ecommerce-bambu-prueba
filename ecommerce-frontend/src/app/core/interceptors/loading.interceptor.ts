import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  
  // Generar una clave única para esta request
  const requestKey = `${req.method}_${req.url}`;
  
  // Iniciar loading
  loadingService.setLoading(requestKey, true);
  
  return next(req).pipe(
    finalize(() => {
      // Finalizar loading
      loadingService.setLoading(requestKey, false);
    })
  );
};
