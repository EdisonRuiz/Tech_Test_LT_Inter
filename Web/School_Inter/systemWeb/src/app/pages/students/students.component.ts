import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { CourseService } from '../../services/course.service';
import { NotificationService } from '../../services/notification.service';
import {
  Course,
  Enrollment,
  NormalizedApiError,
  Student,
  StudentCourseSummary,
} from '../../types/api.types';
import {
  resolveProfessorName,
  useCourseSelectionValidator,
} from '../../hooks/use-course-selection';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-container">
      <div class="page-header-row">
        <div>
          <span class="eyebrow">Administración Académica</span>
          <h1 class="page-title">Gestión de Estudiantes y Matrículas</h1>
          <p class="page-subtitle">
            Consulta el directorio general de estudiantes, revisa el resumen de matriculación y gestiona perfiles.
          </p>
        </div>

        <div class="header-actions">
          <button type="button" class="btn btn-ghost" (click)="refreshAll()" [disabled]="loadingStudents() || loadingEnrollments()">
            Refrescar Datos
          </button>
          <a routerLink="/students/create" class="btn btn-primary">+ Nuevo Estudiante</a>
        </div>
      </div>

      <!-- Pestañas de vista -->
      <div class="tabs-bar">
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'students'"
          (click)="activeTab.set('students')"
        >
          Estudiantes ({{ students().length }})
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'enrollments'"
          (click)="activeTab.set('enrollments')"
        >
          Resumen de Matriculación ({{ enrollments().length }})
        </button>
      </div>

      <!-- TAB 1: Tabla general de estudiantes -->
      @if (activeTab() === 'students') {
        <div class="card filter-toolbar">
          <div class="filter-group">
            <label for="studentSearch">Buscar estudiante por nombre o correo</label>
            <input
              id="studentSearch"
              type="search"
              [ngModel]="studentQuery()"
              (ngModelChange)="studentQuery.set($event)"
              placeholder="Ej. Laura, carlos@campus.edu..."
            />
          </div>
          <div class="filter-stats">
            <span class="stat-chip">Mostrando {{ filteredStudents().length }} de {{ students().length }}</span>
          </div>
        </div>

        @if (loadingStudents()) {
          <div class="card empty-state">Cargando listado de estudiantes...</div>
        } @else if (filteredStudents().length === 0) {
          <div class="card empty-state">
            <h3>Sin resultados</h3>
            <p>No se encontraron estudiantes registrados que coincidan con tu búsqueda.</p>
          </div>
        } @else {
          <div class="card table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Correo</th>
                  <th>Créditos</th>
                  <th>Materias</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (student of filteredStudents(); track student.id) {
                  <tr>
                    <td>
                      <strong class="cell-primary">{{ student.fullName }}</strong>
                      <div class="cell-sub">ID: <code>{{ student.id.slice(0, 8) }}</code></div>
                    </td>
                    <td>{{ student.email }}</td>
                    <td>
                      <span class="credit-tag">{{ student.credits || 9 }} créditos</span>
                    </td>
                    <td>
                      <div class="inline-badges">
                        @for (label of getStudentCourseLabels(student); track label) {
                          <span class="mini-pill">{{ label }}</span>
                        }
                      </div>
                    </td>
                    <td class="text-right">
                      <div class="row-actions">
                        <button
                          type="button"
                          class="btn btn-ghost btn-sm"
                          (click)="openDetailModal(student)"
                        >
                          Ver detalle
                        </button>
                        <button
                          type="button"
                          class="btn btn-secondary btn-sm"
                          (click)="openEditModal(student)"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          class="btn btn-danger btn-sm"
                          (click)="openDeleteModal(student)"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }

      <!-- TAB 2: Resumen de matriculación -->
      @if (activeTab() === 'enrollments') {
        <div class="card filter-toolbar">
          <div class="filter-group">
            <label for="enrollmentSearch">Filtrar resumen de matriculación</label>
            <input
              id="enrollmentSearch"
              type="search"
              [ngModel]="enrollmentQuery()"
              (ngModelChange)="enrollmentQuery.set($event)"
              placeholder="Buscar por estudiante, materia o profesor..."
            />
          </div>
          <div class="filter-stats">
            <span class="stat-chip">Total registros: {{ filteredEnrollments().length }}</span>
          </div>
        </div>

        @if (loadingEnrollments()) {
          <div class="card empty-state">Consultando resumen de matriculación...</div>
        } @else if (filteredEnrollments().length === 0) {
          <div class="card empty-state">
            <h3>No hay inscripciones para mostrar</h3>
            <p>Aún no existen registros de matrícula o el filtro no coincide.</p>
          </div>
        } @else {
          <div class="card table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Estudiante / Materia</th>
                  <th>Detalle de Curso / Profesor</th>
                  <th>Créditos</th>
                  <th>Información adicional</th>
                </tr>
              </thead>
              <tbody>
                @for (item of filteredEnrollments(); track $index) {
                  <tr>
                    <td>
                      <strong class="cell-primary">
                        {{ item.studentName || item.courseName || 'Registro #' + ($index + 1) }}
                      </strong>
                      @if (item.studentEmail) {
                        <div class="cell-sub">{{ item.studentEmail }}</div>
                      }
                    </td>
                    <td>
                      @if (item.courseName) {
                        <div><strong>{{ item.courseName }}</strong></div>
                      }
                      @if (item.professorName) {
                        <div class="cell-sub">Prof. {{ item.professorName }}</div>
                      }
                      @if (item.courses && item.courses.length > 0) {
                        <div class="inline-badges">
                          @for (course of item.courses; track $index) {
                            <span class="mini-pill">{{ formatCourseSummary(course) }}</span>
                          }
                        </div>
                      }
                    </td>
                    <td>
                      <span class="credit-tag">{{ item.credits || 3 }} créditos</span>
                    </td>
                    <td>
                      @if (item.students && item.students.length > 0) {
                        <div class="inline-badges">
                          @for (st of item.students; track st) {
                            <span class="mini-pill">{{ st }}</span>
                          }
                        </div>
                      } @else if (item.enrolledAt) {
                        <span class="cell-sub">{{ item.enrolledAt }}</span>
                      } @else {
                        <span class="cell-sub">Matrícula activa</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }

      <!-- MODAL: Ver Detalle de Estudiante -->
      @if (detailStudent(); as detail) {
        <div class="modal-backdrop" (click)="closeDetailModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <span class="eyebrow">Detalle de Estudiante</span>
                <h2 class="section-title">{{ detail.fullName }}</h2>
              </div>
              <button type="button" class="toast-close" (click)="closeDetailModal()">×</button>
            </div>

            @if (loadingDetail()) {
              <div class="empty-state">Cargando información detallada...</div>
            } @else {
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">ID Estudiante</span>
                  <code>{{ detail.id }}</code>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Correo Electrónico</span>
                  <strong>{{ detail.email }}</strong>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Créditos Inscritos</span>
                  <strong>{{ detail.credits || 9 }} créditos</strong>
                </div>
              </div>

              <div class="detail-courses-section">
                <h3 class="classmates-heading">Materias Inscritas</h3>
                <ul class="selected-course-pills">
                  @for (label of getStudentCourseLabels(detail); track label) {
                    <li>
                      <strong>{{ label }}</strong>
                    </li>
                  }
                </ul>
              </div>
            }

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeDetailModal()">
                Cerrar
              </button>
              <button
                type="button"
                class="btn btn-primary"
                (click)="switchDetailToEdit(detail)"
              >
                Editar Estudiante
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: Editar Estudiante (PUT /api/students/{id}) -->
      @if (editingStudent(); as editing) {
        <div class="modal-backdrop" (click)="closeEditModal()">
          <div class="modal-card modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <span class="eyebrow">Actualizar Registro</span>
                <h2 class="section-title">Editar Estudiante</h2>
              </div>
              <button type="button" class="toast-close" (click)="closeEditModal()">×</button>
            </div>

            @if (modalErrorLogId()) {
              <div class="alert alert-error">
                <span>Ocurrió una excepción de dominio al actualizar.</span>
                <a
                  [routerLink]="['/logs', modalErrorLogId()]"
                  class="alert-link"
                  (click)="closeEditModal()"
                >
                  Ver Log {{ modalErrorLogId() }} →
                </a>
              </div>
            }

            <form [formGroup]="editForm" (ngSubmit)="submitEdit()" class="form-stack">
              <div class="form-field">
                <label for="editFullName">Nombre completo</label>
                <input
                  id="editFullName"
                  type="text"
                  formControlName="fullName"
                  placeholder="Nombre completo del estudiante"
                />
              </div>

              <div
                class="validation-panel"
                [class.validation-ok]="editCourseSelection.isValidSelection()"
                [class.validation-warn]="!editCourseSelection.isValidSelection()"
              >
                <div class="validation-header">
                  <span class="badge-counter">
                    {{ editCourseSelection.selectedCount() }} / 3 Materias seleccionadas
                  </span>
                  @if (editCourseSelection.isValidSelection()) {
                    <span class="status-pill status-ok">3 profesores distintos</span>
                  } @else {
                    <span class="status-pill status-warn">Selecciona 3 materias válidas</span>
                  }
                </div>
                <p class="validation-text">{{ editCourseSelection.validationMessage() }}</p>
              </div>

              <div class="course-selector-grid compact-grid">
                @for (course of courses(); track course.id) {
                  @let selected = editCourseSelection.isSelected(course.id);
                  @let conflict = editCourseSelection.isProfessorConflict(course);
                  @let maxReached = !selected && editCourseSelection.selectedCount() >= 3;

                  <button
                    type="button"
                    class="course-select-card"
                    [class.selected]="selected"
                    [class.conflict]="conflict"
                    [class.disabled]="conflict || maxReached"
                    (click)="onToggleEditCourse(course)"
                  >
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
                <button type="button" class="btn btn-ghost" (click)="closeEditModal()">
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  [disabled]="savingEdit() || editForm.invalid || !editCourseSelection.isValidSelection()"
                >
                  @if (savingEdit()) {
                    <span>Guardando cambios...</span>
                  } @else {
                    <span>Guardar Cambios</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL: Confirmar Eliminación (DELETE /api/students/{id}) -->
      @if (deletingStudent(); as target) {
        <div class="modal-backdrop" (click)="closeDeleteModal()">
          <div class="modal-card modal-sm" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <span class="eyebrow">Confirmación Requerida</span>
                <h2 class="section-title">Eliminar Estudiante</h2>
              </div>
              <button type="button" class="toast-close" (click)="closeDeleteModal()">×</button>
            </div>

            <p class="modal-body-text">
              ¿Estás seguro de que deseas eliminar el registro de
              <strong>{{ target.fullName }}</strong> ({{ target.email }})? Esta acción retirará sus matrículas asociadas.
            </p>

            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" (click)="closeDeleteModal()">
                Cancelar
              </button>
              <button
                type="button"
                class="btn btn-danger"
                [disabled]="deleting()"
                (click)="confirmDelete()"
              >
                @if (deleting()) {
                  <span>Eliminando...</span>
                } @else {
                  <span>Sí, Eliminar</span>
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class StudentsComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly courseService = inject(CourseService);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly activeTab = signal<'students' | 'enrollments'>('students');
  readonly students = signal<Student[]>([]);
  readonly enrollments = signal<Enrollment[]>([]);
  readonly courses = signal<Course[]>([]);

  readonly loadingStudents = signal(false);
  readonly loadingEnrollments = signal(false);
  readonly loadingDetail = signal(false);
  readonly savingEdit = signal(false);
  readonly deleting = signal(false);

  readonly studentQuery = signal('');
  readonly enrollmentQuery = signal('');

  readonly detailStudent = signal<Student | null>(null);
  readonly editingStudent = signal<Student | null>(null);
  readonly deletingStudent = signal<Student | null>(null);
  readonly modalErrorLogId = signal<string | null>(null);

  readonly editCourseSelection = useCourseSelectionValidator(this.courses);

  readonly editForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
  });

  readonly filteredStudents = computed(() => {
    const q = this.studentQuery().trim().toLowerCase();
    if (!q) {
      return this.students();
    }
    return this.students().filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );
  });

  readonly filteredEnrollments = computed(() => {
    const q = this.enrollmentQuery().trim().toLowerCase();
    if (!q) {
      return this.enrollments();
    }
    return this.enrollments().filter((item) => {
      const student = (item.studentName || '').toLowerCase();
      const email = (item.studentEmail || '').toLowerCase();
      const course = (item.courseName || '').toLowerCase();
      const prof = (item.professorName || '').toLowerCase();
      return (
        student.includes(q) ||
        email.includes(q) ||
        course.includes(q) ||
        prof.includes(q)
      );
    });
  });

  ngOnInit(): void {
    this.refreshAll();
  }

  refreshAll(): void {
    this.loadStudents();
    this.loadEnrollments();
    this.loadCourses();
  }

  loadStudents(): void {
    this.loadingStudents.set(true);
    this.studentService.getStudents().subscribe({
      next: (list) => {
        this.students.set(list);
        this.loadingStudents.set(false);
      },
      error: () => {
        this.loadingStudents.set(false);
      },
    });
  }

  loadEnrollments(): void {
    this.loadingEnrollments.set(true);
    this.studentService.getEnrollments().subscribe({
      next: (list) => {
        this.enrollments.set(list);
        this.loadingEnrollments.set(false);
      },
      error: () => {
        this.loadingEnrollments.set(false);
      },
    });
  }

  loadCourses(): void {
    this.courseService.getCourses().subscribe({
      next: (list) => this.courses.set(list),
      error: () => {},
    });
  }

  getProfessorName(course: Course): string {
    return resolveProfessorName(course);
  }

  getStudentCourseLabels(student: Student): string[] {
    if (student.courses && student.courses.length > 0) {
      return student.courses.map((item) => this.formatCourseSummary(item));
    }

    if (student.courseIds && student.courseIds.length > 0) {
      const courseMap = new Map(this.courses().map((c) => [c.id, c.name]));
      return student.courseIds.map((id) => courseMap.get(id) || `Curso #${id.slice(0, 6)}`);
    }

    return ['3 materias inscritas'];
  }

  formatCourseSummary(item: Course | StudentCourseSummary | string): string {
    if (typeof item === 'string') {
      return item;
    }
    return item.name || (item as StudentCourseSummary).courseName || 'Materia';
  }

  openDetailModal(student: Student): void {
    this.detailStudent.set(student);
    this.loadingDetail.set(true);
    this.studentService.getStudentById(student.id).subscribe({
      next: (fresh) => {
        this.detailStudent.set(fresh);
        this.loadingDetail.set(false);
      },
      error: () => {
        this.loadingDetail.set(false);
      },
    });
  }

  closeDetailModal(): void {
    this.detailStudent.set(null);
  }

  switchDetailToEdit(student: Student): void {
    this.closeDetailModal();
    this.openEditModal(student);
  }

  openEditModal(student: Student): void {
    this.modalErrorLogId.set(null);
    this.editingStudent.set(student);
    this.editForm.patchValue({
      fullName: student.fullName,
    });

    const initialIds = this.resolveStudentCourseIds(student);
    this.editCourseSelection.setSelectedIds(initialIds);

    this.studentService.getStudentById(student.id).subscribe({
      next: (detailed) => {
        this.editingStudent.set(detailed);
        this.editForm.patchValue({ fullName: detailed.fullName });
        const freshIds = this.resolveStudentCourseIds(detailed);
        if (freshIds.length > 0) {
          this.editCourseSelection.setSelectedIds(freshIds);
        }
      },
      error: () => {},
    });
  }

  closeEditModal(): void {
    this.editingStudent.set(null);
    this.modalErrorLogId.set(null);
  }

  onToggleEditCourse(course: Course): void {
    const result = this.editCourseSelection.toggleCourse(course);
    if (!result.changed && result.reason) {
      this.notifications.warning('Regla de selección', result.reason);
    }
  }

  submitEdit(): void {
    const target = this.editingStudent();
    if (!target || this.editForm.invalid || !this.editCourseSelection.isValidSelection()) {
      return;
    }

    this.savingEdit.set(true);
    this.modalErrorLogId.set(null);

    const fullName = this.editForm.controls.fullName.value.trim();
    const courseIds = this.editCourseSelection.selectedIds();

    this.studentService
      .updateStudent(target.id, {
        fullName,
        courseIds,
      })
      .subscribe({
        next: () => {
          this.savingEdit.set(false);
          this.notifications.success(
            'Estudiante actualizado',
            `Se actualizaron los datos y materias de ${fullName}.`
          );
          this.closeEditModal();
          this.refreshAll();
        },
        error: (err: NormalizedApiError) => {
          this.savingEdit.set(false);
          if (err?.logId) {
            this.modalErrorLogId.set(err.logId);
          }
        },
      });
  }

  openDeleteModal(student: Student): void {
    this.deletingStudent.set(student);
  }

  closeDeleteModal(): void {
    this.deletingStudent.set(null);
  }

  confirmDelete(): void {
    const target = this.deletingStudent();
    if (!target) {
      return;
    }

    this.deleting.set(true);
    this.studentService.deleteStudent(target.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.notifications.success(
          'Estudiante eliminado',
          `El registro de ${target.fullName} fue eliminado correctamente.`
        );
        this.closeDeleteModal();
        this.refreshAll();
      },
      error: () => {
        this.deleting.set(false);
      },
    });
  }

  private resolveStudentCourseIds(student: Student): string[] {
    if (student.courseIds && student.courseIds.length > 0) {
      return [...student.courseIds];
    }

    if (student.courses && student.courses.length > 0) {
      const catalog = this.courses();
      const matched: string[] = [];

      for (const item of student.courses) {
        if (typeof item === 'string') {
          const byName = catalog.find((c) => c.name.toLowerCase() === item.toLowerCase());
          if (byName) {
            matched.push(byName.id);
          }
        } else {
          const id = item.id || (item as StudentCourseSummary).courseId;
          const name = item.name || (item as StudentCourseSummary).courseName;
          const byId = id ? catalog.find((c) => c.id === id) : undefined;
          if (byId) {
            matched.push(byId.id);
          } else if (name) {
            const byName = catalog.find((c) => c.name.toLowerCase() === name.toLowerCase());
            if (byName) {
              matched.push(byName.id);
            }
          }
        }
      }

      return matched.slice(0, 3);
    }

    return [];
  }
}
