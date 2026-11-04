import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { JsonPipe } from '@angular/common';
import { LogService } from '../../services/log.service';
import { ApiErrorLog, NormalizedApiError } from '../../types/api.types';

@Component({
  selector: 'app-log-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, JsonPipe],
  template: `
    <div class="page-container">
      <div class="page-header-row">
        <div>
          <span class="eyebrow">Auditoría y Diagnóstico</span>
          <h1 class="page-title">Visor de Excepciones y Logs</h1>
          <p class="page-subtitle">
            Consulta la traza técnica generada por el backend ante errores de validación o dominio.
          </p>
        </div>

        <div class="header-actions">
          <a routerLink="/courses" class="btn btn-secondary">← Volver al Portal</a>
        </div>
      </div>

      <!-- Buscador rápido por LogId -->
      <div class="card filter-toolbar">
        <div class="filter-group">
          <label for="lookupLogId">Consultar por identificador de Log (logId)</label>
          <div class="inline-inputs">
            <input
              id="lookupLogId"
              type="text"
              [ngModel]="lookupId()"
              (ngModelChange)="lookupId.set($event)"
              placeholder="Ej. 3fa85f64-5717-4562-b3fc-2c963f66afa6"
            />
            <button type="button" class="btn btn-primary" (click)="searchByInput()" [disabled]="loading()">
              Consultar Log
            </button>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="card empty-state">Consultando GET /api/logs/{{ currentLogId() }}...</div>
      } @else if (errorMessage()) {
        <div class="alert alert-error">
          <div>
            <strong>No se pudo recuperar el log {{ currentLogId() }}:</strong>
            <span>{{ errorMessage() }}</span>
          </div>
        </div>
      } @else if (logDetail(); as log) {
        <div class="card log-detail-card">
          <div class="log-detail-header">
            <div>
              <span class="status-pill status-error">{{ log.level || 'Exception' }}</span>
              <h2 class="section-title">{{ log.message }}</h2>
            </div>
            <code class="id-chip">ID: {{ log.logId || log.id }}</code>
          </div>

          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Fecha y Hora</span>
              <strong>{{ log.timestamp }}</strong>
            </div>

            @if (log.path) {
              <div class="detail-item">
                <span class="detail-label">Endpoint</span>
                <code>{{ log.method ? log.method + ' ' : '' }}{{ log.path }}</code>
              </div>
            }

            @if (log.statusCode) {
              <div class="detail-item">
                <span class="detail-label">Código HTTP</span>
                <strong>{{ log.statusCode }}</strong>
              </div>
            }
          </div>

          @if (log.detail) {
            <div class="log-block">
              <h3>Detalle de Excepción</h3>
              <pre class="code-box">{{ log.detail }}</pre>
            </div>
          }

          @if (log.stackTrace) {
            <div class="log-block">
              <h3>Stack Trace</h3>
              <pre class="code-box">{{ log.stackTrace }}</pre>
            </div>
          }

          <div class="log-block">
            <h3>Payload JSON Completo</h3>
            <pre class="code-box">{{ log | json }}</pre>
          </div>
        </div>
      }
    </div>
  `,
})
export class LogDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly logService = inject(LogService);

  readonly currentLogId = signal('');
  readonly lookupId = signal('');
  readonly loading = signal(false);
  readonly logDetail = signal<ApiErrorLog | null>(null);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('logId') || '';
      this.currentLogId.set(id);
      this.lookupId.set(id);
      if (id) {
        this.fetchLog(id);
      }
    });
  }

  searchByInput(): void {
    const id = this.lookupId().trim();
    if (!id) {
      return;
    }
    void this.router.navigate(['/logs', id]);
  }

  fetchLog(logId: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.logService.getLogById(logId).subscribe({
      next: (data) => {
        this.logDetail.set(data);
        this.loading.set(false);
      },
      error: (err: NormalizedApiError) => {
        this.loading.set(false);
        this.errorMessage.set(err?.message || 'El log solicitado no existe o no tienes permisos.');
      },
    });
  }
}
