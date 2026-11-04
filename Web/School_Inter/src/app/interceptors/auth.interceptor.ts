import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { NormalizedApiError } from '../types/api.types';

export function extractLogId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  const directCandidates = [
    record['logId'],
    record['LogId'],
    record['errorLogId'],
    record['ErrorLogId'],
    record['traceId'],
    (record['error'] as Record<string, unknown> | undefined)?.['logId'],
    (record['data'] as Record<string, unknown> | undefined)?.['logId'],
  ];

  const found = directCandidates.find(
    (item) => typeof item === 'string' && item.trim().length > 0
  ) as string | undefined;

  return found?.trim();
}

export function extractApiErrorMessage(error: HttpErrorResponse): string {
  const payload = error.error;

  if (typeof payload === 'string' && payload.trim().length > 0) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidates = [
      record['message'],
      record['Message'],
      record['detail'],
      record['Detail'],
      record['title'],
      record['Title'],
      record['error'],
    ];

    const firstText = candidates.find(
      (value) => typeof value === 'string' && value.trim().length > 0
    ) as string | undefined;

    if (firstText) {
      return firstText;
    }

    const validationErrors = record['errors'];
    if (validationErrors && typeof validationErrors === 'object') {
      const messages = Object.values(validationErrors as Record<string, unknown>)
        .flatMap((entry) => (Array.isArray(entry) ? entry : [entry]))
        .filter((entry): entry is string => typeof entry === 'string');

      if (messages.length > 0) {
        return messages.join(' ');
      }
    }
  }

  if (error.status === 0) {
    return 'No fue posible conectar con el servidor API (http://localhost:5192). Verifica que el backend esté en ejecución.';
  }

  if (error.status === 401) {
    return 'Tu sesión ha expirado o no tienes autorización. Inicia sesión nuevamente.';
  }

  return error.message || 'Ocurrió un error inesperado al procesar la solicitud.';
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notifications = inject(NotificationService);
  const router = inject(Router);

  const token = authService.getToken();
  const isLoginEndpoint = req.url.toLowerCase().includes('/api/auth/login');

  let requestToSend = req;

  if (token && !isLoginEndpoint) {
    const cleanToken = authService.sanitizeBearerToken(token);
    requestToSend = req.clone({
      setHeaders: {
        Authorization: `Bearer ${cleanToken}`,
      },
    });
  } else if (req.headers.has('Authorization')) {
    const rawHeader = req.headers.get('Authorization') ?? '';
    const cleanToken = authService.sanitizeBearerToken(rawHeader);
    if (cleanToken) {
      requestToSend = req.clone({
        setHeaders: {
          Authorization: `Bearer ${cleanToken}`,
        },
      });
    }
  }

  return next(requestToSend).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const logId = extractLogId(error.error);
        const message = extractApiErrorMessage(error);

        if (error.status === 401 && !isLoginEndpoint) {
          authService.clearSession();
          notifications.warning(
            'Sesión expirada',
            'Tu token ha expirado o no es válido. Por favor inicia sesión nuevamente.'
          );
          void router.navigate(['/login']);
        } else {
          notifications.error(
            error.status ? `Error HTTP ${error.status}` : 'Error de conexión',
            message,
            logId
          );
        }

        const normalized: NormalizedApiError = {
          status: error.status,
          message,
          logId,
          raw: error.error,
        };

        return throwError(() => normalized);
      }

      return throwError(() => error);
    })
  );
};
