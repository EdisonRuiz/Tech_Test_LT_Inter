import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CourseService } from '../../services/course.service';
import { StudentService } from '../../services/student.service';
import { NotificationService } from '../../services/notification.service';
import { Course, NormalizedApiError } from '../../types/api.types';
import {
  resolveProfessorName,
  useCourseSelectionValidator,
} from '../../hooks/use-course-selection';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterLink],
  template: `
    <div class="page-container">
      <div class="page-header-row">
        <div>
          <span class="eyebrow">Inscripción Académica</span>
          <h1 class="page-title">Registro de Estudiante</h1>
          <p class="page-subtitle">
            Completa los datos del estudiante y selecciona <strong>exactamente 3 materias</strong> dictadas por profesores distintos.
          </p>
        </div>
        @if (authService.isAuthenticated()) {
          <a routerLink="/students" class="btn btn-secondary">← Volver a Estudiantes</a>
        } @else {
          <a routerLink="/login" class="btn btn-secondary">¿Ya tienes cuenta? Inicia sesión</a>
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

      <div class="split-grid">
        <!-- Datos del estudiante -->
        <section class="card">
          <h2 class="section-title">1. Datos Personales</h2>
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

            <!-- Resumen de reglas -->
            <div
              class="validation-panel"
              [class.validation-ok]="courseSelection.isValidSelection()"
              [class.validation-warn]="!courseSelection.isValidSelection()"
            >
              <div class="validation-header">
                <span class="badge-counter">
                  {{ courseSelection.selectedCount() }} / 3 Materias ({{ courseSelection.selectedCount() * 3 }} créditos)
                </span>
                @if (courseSelection.isValidSelection()) {
                  <span class="status-pill status-ok">Reglas cumplidas</span>
                } @else {
                  <span class="status-pill status-warn">Pendiente de validación</span>
                }
              </div>
              <p class="validation-text">{{ courseSelection.validationMessage() }}</p>

              @if (courseSelection.selectedCourses().length > 0) {
                <ul class="selected-course-pills">
                  @for (selected of courseSelection.selectedCourses(); track selected.id) {
                    <li>
                      <div>
                        <strong>{{ selected.name }}</strong>
                        <small>{{ getProfessorName(selected) }}</small>
                      </div>
                      <button
                        type="button"
                        class="pill-remove"
                        (click)="onToggleCourse(selected)"
                        title="Quitar materia"
                      >
                        ×
                      </button>
                    </li>
                  }
                </ul>
              }
            </div>

            <div class="form-actions-stack">
              <button
                type="submit"
                class="btn btn-primary btn-block"
                [disabled]="submitting() || registerForm.invalid || !courseSelection.isValidSelection()"
              >
                @if (submitting()) {
                  <span>Registrando estudiante...</span>
                } @else {
                  <span>Completar Registro (3 Materias)</span>
                }
              </button>
            </div>
          </form>
        </section>

        <!-- Selección de 3 materias -->
        <section class="card">
          <div class="section-header-inline">
            <div>
              <h2 class="section-title">2. Selección de Materias</h2>
              <p class="section-caption">
                Cada materia equivale a 3 créditos. No se permite repetir profesor.
              </p>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" (click)="loadCourses()" [disabled]="loadingCourses()">
              Actualizar catálogo
            </button>
          </div>

          <div class="search-bar">
            <input
              type="search"
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              placeholder="Filtrar por nombre de materia o profesor..."
            />
          </div>

          @if (loadingCourses()) {
            <div class="empty-state">Cargando catálogo de materias desde la API...</div>
          } @else if (courses().length === 0) {
            <div class="empty-state">
              <p>
                No se pudieron cargar las materias automáticamente (puede requerir sesión activa en el backend).
              </p>
              <div class="manual-guid-box">
                <p class="section-caption">
                  También puedes agregar un ID de materia (GUID) manualmente o iniciar sesión primero:
                </p>
                <div class="inline-inputs">
                  <input
                    type="text"
                    [ngModel]="manualCourseId()"
                    (ngModelChange)="manualCourseId.set($event)"
                    placeholder="GUID de la materia"
                  />
                  <input
                    type="text"
                    [ngModel]="manualProfessor()"
                    (ngModelChange)="manualProfessor.set($event)"
                    placeholder="Nombre del profesor"
                  />
                  <button type="button" class="btn btn-secondary" (click)="addManualCourse()">
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          } @else {
            <div class="course-selector-grid">
              @for (course of filteredCourses(); track course.id) {
                @let selected = courseSelection.isSelected(course.id);
                @let conflict = courseSelection.isProfessorConflict(course);
                @let maxReached = !selected && courseSelection.selectedCount() >= 3;

                <button
                  type="button"
                  class="course-select-card"
                  [class.selected]="selected"
                  [class.conflict]="conflict"
                  [class.disabled]="conflict || maxReached"
                  (click)="onToggleCourse(course)"
                >
                  <div class="course-select-top">
                    <span class="course-credits">{{ course.credits || 3 }} créditos</span>
                    @if (selected) {
                      <span class="course-state-badge badge-selected">Seleccionada</span>
                    } @else if (conflict) {
                      <span class="course-state-badge badge-conflict">Mismo profesor</span>
                    } @else if (maxReached) {
                      <span class="course-state-badge badge-muted">Cupo 3/3</span>
                    }
                  </div>
                  <h3 class="course-select-name">{{ course.name }}</h3>
                  <p class="course-select-prof">Prof. {{ getProfessorName(course) }}</p>
                </button>
              }
            </div>
          }
        </section>
      </div>
    </div>
  `,
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly courseService = inject(CourseService);
  private readonly studentService = inject(StudentService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  readonly courses = signal<Course[]>([]);
  readonly loadingCourses = signal(false);
  readonly submitting = signal(false);
  readonly searchTerm = signal('');
  readonly errorBanner = signal<string | null>(null);
  readonly errorLogId = signal<string | null>(null);

  readonly manualCourseId = signal('');
  readonly manualProfessor = signal('');

  readonly courseSelection = useCourseSelectionValidator(this.courses);

  readonly filteredCourses = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) {
      return this.courses();
    }
    return this.courses().filter((course) => {
      const name = course.name.toLowerCase();
      const prof = resolveProfessorName(course).toLowerCase();
      return name.includes(query) || prof.includes(query);
    });
  });

  readonly registerForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.loadingCourses.set(true);
    this.courseService.getCourses().subscribe({
      next: (list) => {
        this.courses.set(list);
        this.loadingCourses.set(false);
      },
      error: () => {
        this.loadingCourses.set(false);
      },
    });
  }

  getProfessorName(course: Course): string {
    return resolveProfessorName(course);
  }

  isFieldInvalid(field: 'fullName' | 'email' | 'password'): boolean {
    const control = this.registerForm.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  onToggleCourse(course: Course): void {
    const result = this.courseSelection.toggleCourse(course);
    if (!result.changed && result.reason) {
      this.notifications.warning('Regla de selección', result.reason);
    }
  }

  addManualCourse(): void {
    const id = this.manualCourseId().trim();
    const prof = this.manualProfessor().trim() || `Profesor ${this.courses().length + 1}`;
    if (!id) {
      this.notifications.warning('ID requerido', 'Ingresa un GUID de materia válido.');
      return;
    }

    const exists = this.courses().some((c) => c.id === id);
    if (!exists) {
      const customCourse: Course = {
        id,
        name: `Materia (${id.slice(0, 8)})`,
        credits: 3,
        professorName: prof,
      };
      this.courses.update((prev) => [...prev, customCourse]);
      this.onToggleCourse(customCourse);
    }
    this.manualCourseId.set('');
    this.manualProfessor.set('');
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (!this.courseSelection.isValidSelection()) {
      this.notifications.warning(
        'Selección inválida',
        this.courseSelection.validationMessage()
      );
      return;
    }

    this.submitting.set(true);
    this.errorBanner.set(null);
    this.errorLogId.set(null);

    const { fullName, email, password } = this.registerForm.getRawValue();
    const courseIds = this.courseSelection.selectedIds();

    this.studentService
      .createStudent({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        courseIds,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.notifications.success(
            'Estudiante registrado',
            `Se inscribió a ${fullName} con 3 materias exitosamente.`
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
