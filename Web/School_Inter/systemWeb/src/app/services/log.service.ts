import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL, ApiErrorLog } from '../types/api.types';

@Injectable({
  providedIn: 'root',
})
export class LogService {
  private readonly http = inject(HttpClient);

  getLogById(logId: string): Observable<ApiErrorLog> {
    return this.http.get<unknown>(`${API_BASE_URL}/api/logs/${encodeURIComponent(logId)}`).pipe(
      map((res) => this.normalizeLog(res, logId))
    );
  }

  private normalizeLog(raw: unknown, requestedLogId: string): ApiErrorLog {
    if (!raw || typeof raw !== 'object') {
      return {
        id: requestedLogId,
        logId: requestedLogId,
        message: typeof raw === 'string' ? raw : 'Registro de excepción recuperado.',
      };
    }

    const record = raw as Record<string, unknown>;
    const payload =
      record['data'] && typeof record['data'] === 'object'
        ? (record['data'] as Record<string, unknown>)
        : record;

    return {
      ...payload,
      id: String(payload['id'] ?? payload['Id'] ?? payload['logId'] ?? payload['LogId'] ?? requestedLogId),
      logId: String(payload['logId'] ?? payload['LogId'] ?? payload['id'] ?? payload['Id'] ?? requestedLogId),
      timestamp: String(
        payload['timestamp'] ??
          payload['Timestamp'] ??
          payload['createdAt'] ??
          payload['CreatedAt'] ??
          payload['date'] ??
          new Date().toISOString()
      ),
      level: String(payload['level'] ?? payload['Level'] ?? payload['severity'] ?? 'Error'),
      message: String(
        payload['message'] ??
          payload['Message'] ??
          payload['error'] ??
          payload['Error'] ??
          payload['title'] ??
          'Excepción de dominio registrada'
      ),
      detail: String(
        payload['detail'] ??
          payload['Detail'] ??
          payload['details'] ??
          payload['Details'] ??
          payload['exception'] ??
          payload['Exception'] ??
          ''
      ),
      stackTrace: (payload['stackTrace'] ?? payload['StackTrace']) as string | undefined,
      path: (payload['path'] ?? payload['Path'] ?? payload['endpoint'] ?? payload['Endpoint']) as
        | string
        | undefined,
      method: (payload['method'] ?? payload['Method']) as string | undefined,
      statusCode:
        payload['statusCode'] !== undefined || payload['StatusCode'] !== undefined
          ? Number(payload['statusCode'] ?? payload['StatusCode'])
          : undefined,
    };
  }
}
