import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { NormalizedApiError } from '../../types/api.types';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="card auth-card">
        <div class="card-header">
          <h1 class="page-title">Iniciar Sesión</h1>
          <p class="page-subtitle">
            Ingresa tus credenciales académicas para gestionar tus materias y compañeros.
          </p>
        </div>

        @if (errorBanner()) {
          <div class="alert alert-error">
            <div>
              <strong>Error de autenticación:</strong>
              <span>{{ errorBanner() }}</span>
            </div>
            @if (errorLogId()) {
              <a [routerLink]="['/logs', errorLogId()]" class="alert-link">
                Consultar log {{ errorLogId() }}
              </a>
            }
          </div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="form-stack" novalidate>
          <div class="form-field">
            <label for="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="estudiante@universidad.edu"
              autocomplete="email"
              [class.input-invalid]="isFieldInvalid('email')"
            />
            @if (isFieldInvalid('email')) {
              <small class="field-error">Ingresa un correo electrónico válido.</small>
            }
          </div>

          <div class="form-field">
            <label for="password">Contraseña</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="••••••••"
              autocomplete="current-password"
              [class.input-invalid]="isFieldInvalid('password')"
            />
            @if (isFieldInvalid('password')) {
              <small class="field-error">La contraseña es obligatoria.</small>
            }
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading()">
            @if (loading()) {
              <span>Autenticando...</span>
            } @else {
              <span>Ingresar al Portal</span>
            }
          </button>
        </form>

        <div class="auth-footer">
          <span>¿Aún no tienes cuenta de estudiante?</span>
          <a routerLink="/register" class="link-strong">Regístrate</a>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly errorBanner = signal<string | null>(null);
  readonly errorLogId = signal<string | null>(null);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(3)]],
  });

  isFieldInvalid(field: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorBanner.set(null);
    this.errorLogId.set(null);

    const { email, password } = this.loginForm.getRawValue();

    this.authService
      .login({
        Email: email.trim(),
        Password: password,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          if (!this.authService.isAuthenticated()) {
            this.errorBanner.set(
              'El servidor respondió sin un token JWT válido. Verifica las credenciales o el formato de respuesta.'
            );
            return;
          }

          this.notifications.success('Bienvenido', 'Has iniciado sesión correctamente.');
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/courses';
          void this.router.navigateByUrl(returnUrl);
        },
        error: (err: NormalizedApiError) => {
          this.loading.set(false);
          this.errorBanner.set(err?.message || 'Credenciales inválidas o servicio no disponible.');
          if (err?.logId) {
            this.errorLogId.set(err.logId);
          }
        },
      });
  }
}
