import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [RouterLink],
  template: `
    <aside class="toast-stack" aria-live="polite" aria-atomic="true">
      @for (toast of notifications.toasts(); track toast.id) {
        <div class="toast-card" [class]="'toast-card toast-' + toast.type">
          <div class="toast-header">
            <span class="toast-badge">{{ getLabel(toast.type) }}</span>
            <strong class="toast-title">{{ toast.title }}</strong>
            <button
              type="button"
              class="toast-close"
              (click)="notifications.dismiss(toast.id)"
              aria-label="Cerrar notificación"
            >
              ×
            </button>
          </div>

          <p class="toast-message">{{ toast.message }}</p>

          @if (toast.logId) {
            <div class="toast-log-box">
              <span class="toast-log-id">Log ID: <code>{{ toast.logId }}</code></span>
              <a
                [routerLink]="['/logs', toast.logId]"
                class="toast-log-link"
                (click)="notifications.dismiss(toast.id)"
              >
                Ver detalle del log →
              </a>
            </div>
          }
        </div>
      }
    </aside>
  `,
})
export class ToastContainerComponent {
  readonly notifications = inject(NotificationService);

  getLabel(type: 'success' | 'error' | 'info' | 'warning'): string {
    switch (type) {
      case 'success':
        return 'Éxito';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Alerta';
      default:
        return 'Info';
    }
  }
}
