import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CourseService } from '../../services/course.service';
import { NotificationService } from '../../services/notification.service';
import { StudentService } from '../../services/student.service';
import { Course, NormalizedApiError, Student, StudentCourseSummary } from '../../types/api.types';
import { resolveProfessorName, useCourseSelectionValidator } from '../../hooks/use-course-selection';

@Component({
  selector: 'app-student-editor',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="modal-backdrop" (click)="close()" (keydown.escape)="close()">
      <div class="modal-card modal-lg" role="dialog" aria-modal="true"
        aria-labelledby="studentEditorTitle" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <span class="eyebrow">{{ enrollmentOnly() ? 'Matricula' : 'Actualizar Registro' }}</span>
            <h2 id="studentEditorTitle" class="section-title">
              {{ enrollmentOnly() ? 'Matricular' : 'Editar Estudiante' }}
            </h2>
          </div>
          <button type="button" class="toast-close" aria-label="Cerrar" (click)="close()" [disabled]="saving()">&times;</button>
        </div>

        @if (errorMessage()) {
          <div class="alert alert-error" role="alert">
            <span>{{ errorMessage() }}</span>
            @if (errorLogId() && authService.isAdmin()) {
              <a [routerLink]="['/logs', errorLogId()]" class="alert-link" (click)="close()">Ver Log</a>
            }
          </div>
        }

        @if (loading()) {
          <div class="empty-state">Cargando estudiante y materias...</div>
        } @else if (!student()) {
          <button type="button" class="btn btn-secondary" (click)="loadStudent()">Reintentar</button>
        } @else {
          <form [formGroup]="editForm" (ngSubmit)="submit()" class="form-stack">
            @if (!enrollmentOnly()) {
              <div class="form-field">
                <label for="editFullName">Nombre completo</label>
                <input id="editFullName" type="text" formControlName="fullName" />
              </div>
            }

            <div class="validation-panel"
              [class.validation-ok]="courseSelection.isValidSelection()"
              [class.validation-warn]="!courseSelection.isValidSelection()">
              <div class="validation-header">
                <span class="badge-counter">{{ courseSelection.selectedCount() }} / 3 Materias seleccionadas</span>
                @if (courseSelection.isValidSelection()) {
                  <span class="status-pill status-ok">3 profesores distintos</span>
                } @else {
                  <span class="status-pill status-warn">Selecciona 3 materias validas</span>
                }
              </div>
              <p class="validation-text">{{ courseSelection.validationMessage() }}</p>
            </div>

            @if (courses().length === 0) {
              <p class="empty-state">No hay materias disponibles.</p>
            }
            <div class="course-selector-grid compact-grid">
              @for (course of courses(); track course.id) {
                @let selected = courseSelection.isSelected(course.id);
                @let conflict = courseSelection.isProfessorConflict(course);
                @let maxReached = !selected && courseSelection.selectedCount() >= 3;
                <button type="button" class="course-select-card"
                  [class.selected]="selected" [class.conflict]="conflict"
                  [class.disabled]="conflict || maxReached"
                  [disabled]="saving() || conflict || maxReached"
                  [attr.aria-pressed]="selected" (click)="toggleCourse(course)">
                  <div class="course-select-top">
                    <span class="course-credits">{{ course.credits || 3 }} cr.</span>
                    @if (selected) {
                      <span class="course-state-badge badge-selected">Activa</span>
                    } @else if (conflict) {
                      <span class="course-state-badge badge-conflict">Mismo prof.</span>
                    }
                  </div>
                  <h4 class="course-select-name">{{ course.name }}</h4>
                  <p class="course-select-prof">Prof. {{ getProfessorName(course) }}</p>
                </button>
              }
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" (click)="close()" [disabled]="saving()">Cancelar</button>
              <button type="submit" class="btn btn-primary"
                [disabled]="saving() || editForm.invalid || !courseSelection.isValidSelection()">
                {{ saving() ? 'Guardando cambios...' : enrollmentOnly() ? 'Matricular' : 'Guardar Cambios' }}
              </button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
})
export class StudentEditorComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly courseService = inject(CourseService);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);

  readonly studentId = input.required<string>();
  readonly enrollmentOnly = input(false);
  readonly saved = output<void>();
  readonly closed = output<void>();
  readonly student = signal<Student | null>(null);
  readonly courses = signal<Course[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly errorLogId = signal<string | null>(null);
  readonly courseSelection = useCourseSelectionValidator(this.courses);
  readonly editForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
  });

  ngOnInit(): void {
    this.loadStudent();
  }

  loadStudent(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.errorLogId.set(null);
    forkJoin({
      student: this.studentService.getStudentById(this.studentId()),
      courses: this.courseService.getCourses(),
    }).subscribe({
      next: ({ student, courses }) => {
        this.student.set(student);
        this.courses.set(courses);
        this.editForm.patchValue({ fullName: student.fullName });
        this.courseSelection.setSelectedIds(this.resolveCourseIds(student));
        this.loading.set(false);
      },
      error: (error: NormalizedApiError) => {
        this.loading.set(false);
        this.errorMessage.set(error?.message || 'No se pudieron cargar los datos de matricula.');
        this.errorLogId.set(error?.logId || null);
      },
    });
  }

  getProfessorName(course: Course): string {
    return resolveProfessorName(course);
  }

  toggleCourse(course: Course): void {
    if (this.saving()) {
      return;
    }
    const result = this.courseSelection.toggleCourse(course);
    if (!result.changed && result.reason) {
      this.notifications.warning('Regla de seleccion', result.reason);
    }
  }

  submit(): void {
    if (this.loading() || this.saving() || !this.student() || this.editForm.invalid || !this.courseSelection.isValidSelection()) {
      return;
    }
    this.saving.set(true);
    this.errorMessage.set(null);
    this.errorLogId.set(null);
    const fullName = this.editForm.controls.fullName.value.trim();
    this.studentService.updateStudent(this.studentId(), {
      fullName,
      courseIds: this.courseSelection.selectedIds(),
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.notifications.success(
          this.enrollmentOnly() ? 'Matricula registrada' : 'Estudiante actualizado',
          `Se actualizaron los datos y materias de ${fullName}.`
        );
        this.saved.emit();
      },
      error: (error: NormalizedApiError) => {
        this.saving.set(false);
        this.errorMessage.set(error?.message || 'No se pudo guardar la matricula.');
        this.errorLogId.set(error?.logId || null);
      },
    });
  }

  close(): void {
    if (!this.saving()) {
      this.closed.emit();
    }
  }

  private resolveCourseIds(student: Student): string[] {
    if (student.courseIds?.length) {
      return [...student.courseIds];
    }
    const matched: string[] = [];
    for (const item of student.courses || []) {
      const id = typeof item === 'string' ? item : item.id || (item as StudentCourseSummary).courseId;
      const name = typeof item === 'string' ? item : item.name || (item as StudentCourseSummary).courseName;
      const course = this.courses().find((candidate) => candidate.id === id) ||
        this.courses().find((candidate) => name && candidate.name.toLowerCase() === name.toLowerCase());
      if (course) {
        matched.push(course.id);
      }
    }
    return matched.slice(0, 3);
  }
}