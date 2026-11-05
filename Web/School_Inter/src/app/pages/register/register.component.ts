import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { StudentService } from '../../services/student.service';
import { NotificationService } from '../../services/notification.service';
import { NormalizedApiError } from '../../types/api.types';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  styles: `
    .register-page {
      width: 100%;
      max-width: 440px;
      min-height: calc(100dvh - 150px);
      margin-inline: auto;
      justify-content: center;
    }

    .register-page .page-header-row {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
  `,
  template: `
    <div class="page-container register-page">
      <div class="page-header-row">
        <div>
          <span class="eyebrow">Inscripción Académica</span>
          <h1 class="page-title">Registro de Estudiante</h1>
          <p class="page-subtitle">
            Completa los datos del estudiante.
          </p>
        </div>
        @if (authService.isAuthenticated()) {
          <a routerLink="/students" class="btn btn-secondary">← Volver a Estudiantes</a>
        }
      </div>

      @if (errorBanner()) {
        <div class="alert alert-error">
          <div>
            <strong>No se pudo completar el registro:</strong>
            <span>{{ errorBanner() }}</span>
          </div>
          @if (errorLogId()) {
            <a [routerLink]="['/logs', errorLogId()]" class="alert-link">
              Ver detalle del log ({{ errorLogId() }}) →
            </a>
          }
        </div>
      }

        <section class="card auth-card">
          <h2 class="section-title">Datos Personales</h2>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="form-stack" novalidate>
            <div class="form-field">
              <label for="fullName">Nombre completo</label>
              <input
                id="fullName"
                type="text"
                formControlName="fullName"
                placeholder="Ej. Ana María Gómez"
                [class.input-invalid]="isFieldInvalid('fullName')"
              />
              @if (isFieldInvalid('fullName')) {
                <small class="field-error">Ingresa el nombre completo (mínimo 3 caracteres).</small>
              }
            </div>

            <div class="form-field">
              <label for="email">Correo institucional</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                placeholder="ana.gomez@campus.edu"
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
                placeholder="Mínimo 6 caracteres"
                [class.input-invalid]="isFieldInvalid('password')"
              />
              @if (isFieldInvalid('password')) {
                <small class="field-error">La contraseña debe tener al menos 6 caracteres.</small>
              }
            </div>

            <div class="form-actions-stack">
              <button
                type="submit"
                class="btn btn-primary btn-block"
                [disabled]="submitting() || registerForm.invalid"
              >
                @if (submitting()) {
                  <span>Registrando estudiante...</span>
                } @else {
                  <span>Completar Registro</span>
                }
              </button>
            </div>
          </form>
        </section>

    </div>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly studentService = inject(StudentService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  readonly submitting = signal(false);
  readonly errorBanner = signal<string | null>(null);
  readonly errorLogId = signal<string | null>(null);

  readonly registerForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  isFieldInvalid(field: 'fullName' | 'email' | 'password'): boolean {
    const control = this.registerForm.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorBanner.set(null);
    this.errorLogId.set(null);

    const { fullName, email, password } = this.registerForm.getRawValue();

    this.studentService
      .createStudent({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.notifications.success(
            'Estudiante registrado',
            `Se registró a ${fullName} exitosamente.`
          );

          if (this.authService.isAuthenticated()) {
            void this.router.navigate(['/students']);
          } else {
            void this.router.navigate(['/login']);
          }
        },
        error: (err: NormalizedApiError) => {
          this.submitting.set(false);
          this.errorBanner.set(err?.message || 'Error al registrar el estudiante.');
          if (err?.logId) {
            this.errorLogId.set(err.logId);
          }
        },
      });
  }
}
