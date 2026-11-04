import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { AuthService } from '../../services/auth.service';
import { MyCourseClassmate, MyCourseItem } from '../../types/api.types';

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page-container">
      <div class="page-header-row">
        <div>
          <span class="eyebrow">Mi Plan de Estudios</span>
          <h1 class="page-title">Mis Clases y Compañeros</h1>
          <p class="page-subtitle">
            Consulta las materias en las que estás inscrito y conoce a los estudiantes que comparten clase contigo.
          </p>
        </div>

        <div class="header-actions">
          <button type="button" class="btn btn-secondary" (click)="loadMyCourses()" [disabled]="loading()">
            Actualizar
          </button>
          <a routerLink="/courses" class="btn btn-ghost">Ver Catálogo</a>
        </div>
      </div>

      <!-- Tarjetas de resumen -->
      <div class="summary-cards-row">
        <div class="card stat-card">
          <span class="stat-label">Materias Inscritas</span>
          <strong class="stat-value">{{ myCourses().length }}</strong>
          <small class="stat-meta">Meta académica: 3 materias</small>
        </div>

        <div class="card stat-card">
          <span class="stat-label">Créditos Activos</span>
          <strong class="stat-value">{{ totalCredits() }}</strong>
          <small class="stat-meta">3 créditos por materia</small>
        </div>

        <div class="card stat-card">
          <span class="stat-label">Compañeros Únicos</span>
          <strong class="stat-value">{{ uniqueClassmatesCount() }}</strong>
          <small class="stat-meta">En tus cursos actuales</small>
        </div>
      </div>

      <div class="card filter-toolbar">
        <div class="filter-group">
          <label for="classmateFilter">Buscar por materia, profesor o compañero</label>
          <input
            id="classmateFilter"
            type="search"
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            placeholder="Ej. Cálculo, Ing. López, Carlos..."
          />
        </div>
      </div>

      @if (loading()) {
        <div class="card empty-state">Consultando tus clases y compañeros...</div>
      } @else if (filteredCourses().length === 0) {
        <div class="card empty-state">
          <h3>No se encontraron materias inscritas</h3>
          <p>
            Aún no registras materias asociadas a tu perfil o el filtro de búsqueda no coincide con tus clases.
          </p>
          <a routerLink="/courses" class="btn btn-primary">Explorar Materias Disponibles</a>
        </div>
      } @else {
        <div class="my-courses-grid">
          @for (course of filteredCourses(); track course.id || course.name) {
            @let mates = getClassmateNames(course);

            <article class="card my-course-card">
              <div class="my-course-header">
                <div>
                  <span class="credit-tag">{{ course.credits || 3 }} Créditos</span>
                  <h2 class="course-card-title">{{ course.name || course.courseName }}</h2>
                  <p class="course-card-prof">
                    Profesor: <strong>{{ course.professorName || 'Asignado' }}</strong>
                  </p>
                </div>
                <span class="mates-count-badge">
                  {{ mates.length }} {{ mates.length === 1 ? 'compañero' : 'compañeros' }}
                </span>
              </div>

              <div class="classmates-section">
                <h3 class="classmates-heading">Compañeros de clase</h3>

                @if (mates.length === 0) {
                  <p class="no-mates-text">
                    Aún no hay otros estudiantes inscritos en esta materia.
                  </p>
                } @else {
                  <ul class="classmates-list">
                    @for (mate of mates; track mate) {
                      <li class="classmate-chip">
                        <span class="avatar-circle">{{ getInitials(mate) }}</span>
                        <span class="classmate-name">{{ mate }}</span>
                      </li>
                    }
                  </ul>
                }
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
})
export class MyCoursesComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  readonly authService = inject(AuthService);

  readonly myCourses = signal<MyCourseItem[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');

  readonly totalCredits = computed(() =>
    this.myCourses().reduce((acc, item) => acc + (item.credits || 3), 0)
  );

  readonly uniqueClassmatesCount = computed(() => {
    const names = new Set<string>();
    for (const course of this.myCourses()) {
      for (const mate of this.getClassmateNames(course)) {
        names.add(mate.toLowerCase());
      }
    }
    return names.size;
  });

  readonly filteredCourses = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) {
      return this.myCourses();
    }

    return this.myCourses().filter((course) => {
      const name = (course.name || course.courseName || '').toLowerCase();
      const prof = (course.professorName || '').toLowerCase();
      const mates = this.getClassmateNames(course).some((m) => m.toLowerCase().includes(query));
      return name.includes(query) || prof.includes(query) || mates;
    });
  });

  ngOnInit(): void {
    this.loadMyCourses();
  }

  loadMyCourses(): void {
    this.loading.set(true);
    this.studentService.getMyCourses().subscribe({
      next: (items) => {
        this.myCourses.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  getClassmateNames(course: MyCourseItem): string[] {
    const raw = course.classmates || course.students || course.companions || [];
    return raw
      .map((item: MyCourseClassmate | string) => {
        if (typeof item === 'string') {
          return item.trim();
        }
        return (item.fullName || item.name || item.email || '').trim();
      })
      .filter((name) => name.length > 0);
  }

  getInitials(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
}
