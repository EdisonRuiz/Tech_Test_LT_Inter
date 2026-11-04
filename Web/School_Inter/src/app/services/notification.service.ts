import { Injectable, signal } from '@angular/core';
import { ToastMessage } from '../types/api.types';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  readonly toasts = signal<ToastMessage[]>([]);
  readonly lastLogId = signal<string | null>(null);

  show(
    type: ToastMessage['type'],
    title: string,
    message: string,
    logId?: string,
    durationMs = 7000
  ): void {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    if (logId) {
      this.lastLogId.set(logId);
    }

    const toast: ToastMessage = {
      id,
      type,
      title,
      message,
      logId,
      createdAt: Date.now(),
    };

    this.toasts.update((list) => [toast, ...list].slice(0, 5));

    if (durationMs > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, durationMs);
    }
  }

  success(title: string, message: string): void {
    this.show('success', title, message, undefined, 4500);
  }

  info(title: string, message: string): void {
    this.show('info', title, message, undefined, 4500);
  }

  warning(title: string, message: string): void {
    this.show('warning', title, message, undefined, 6000);
  }

  error(title: string, message: string, logId?: string): void {
    this.show('error', title, message, logId, logId ? 12000 : 7500);
  }

  dismiss(id: string): void {
    this.toasts.update((list) => list.filter((item) => item.id !== id));
  }

  clearAll(): void {
    this.toasts.set([]);
  }
}
