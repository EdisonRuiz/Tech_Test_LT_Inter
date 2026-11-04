import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { Course } from '../../types/api.types';
import { resolveProfessorName } from '../../hooks/use-course-selection';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page-container">
      <div class="page-header-row">
        <div>
          <span class="eyebrow">Catálogo Académico</span>
          <h1 class="page-title">Materias Disponibles</h1>
          <p class="page-subtitle">
            Explora la oferta de cursos activos, sus créditos y profesores asignados.
          </p>
        </div>

        <div class="header-actions">
          <div class="view-switcher">
            <button
              type="button"
              class="btn btn-sm"
              [class.btn-primary]="viewMode() === 'grid'"
              [class.btn-ghost]="viewMode() !== 'grid'"
              (click)="viewMode.set('grid')"
            >
              Grid
            </button>
            <button
              type="button"
              class="btn btn-sm"
              [class.btn-primary]="viewMode() === 'table'"
              [class.btn-ghost]="viewMode() !== 'table'"
              (click)="viewMode.set('table')"
            >
              Tabla
            </button>
          </div>
          <a routerLink="/my-courses" class="btn btn-secondary">Ver Mis Clases</a>
        </div>
      </div>

      <!-- Filtros -->
      <div class="card filter-toolbar">
        <div class="filter-group">
          <label for="courseSearch">Buscar por materia o profesor</label>
          <input
            id="courseSearch"
            type="search"
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            placeholder="Ej. Matemáticas, Programación, Dr. Pérez..."
          />
        </div>

        <div class="filter-group">
          <label for="professorFilter">Filtrar por profesor</label>
          <select
            id="professorFilter"
            [ngModel]="selectedProfessor()"
            (ngModelChange)="selectedProfessor.set($event)"
          >
            <option value="">Todos los profesores ({{ uniqueProfessors().length }})</option>
            @for (prof of uniqueProfessors(); track prof) {
              <option [value]="prof">{{ prof }}</option>
            }
          </select>
        </div>

        <div class="filter-stats">
          <span class="stat-chip">Total: {{ filteredCourses().length }} materias</span>
          <button type="button" class="btn btn-ghost btn-sm" (click)="loadCourses()" [disabled]="loading()">
            Refrescar
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="card empty-state">Cargando catálogo de materias...</div>
      } @else if (filteredCourses().length === 0) {
        <div class="card empty-state">
          <h3>No se encontraron materias</h3>
          <p>Intenta ajustar los filtros de búsqueda o actualizar el catálogo.</p>
        </div>
      } @else if (viewMode() === 'grid') {
        <div class="catalog-grid">
          @for (course of filteredCourses(); track course.id) {
            <article class="card course-card">
              <div class="course-card-top">
                <span class="credit-tag">{{ course.credits || 3 }} Créditos</span>
                <code class="id-chip" [title]="course.id">#{{ course.id.slice(0, 8) }}</code>
              </div>

              <h2 class="course-card-title">{{ course.name }}</h2>

              @if (course.description) {
                <p class="course-card-desc">{{ course.description }}</p>
              }

              <div class="course-card-footer">
                <span class="professor-label">Profesor titular</span>
                <strong class="professor-value">{{ getProfessor(course) }}</strong>
              </div>
            </article>
          }
        </div>
      } @else {
        <div class="card table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Materia</th>
                <th>Profesor</th>
                <th>Créditos</th>
                <th>ID de Curso</th>
              </tr>
            </thead>
            <tbody>
              @for (course of filteredCourses(); track course.id) {
                <tr>
                  <td>
                    <strong class="cell-primary">{{ course.name }}</strong>
                  </td>
                  <td>{{ getProfessor(course) }}</td>
                  <td>
                    <span class="credit-tag">{{ course.credits || 3 }} créditos</span>
                  </td>
                  <td>
                    <code class="id-chip">{{ course.id }}</code>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class CoursesComponent implements OnInit {
  private readonly courseService = inject(CourseService);

  readonly courses = signal<Course[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly selectedProfessor = signal('');
  readonly viewMode = signal<'grid' | 'table'>('grid');

  readonly uniqueProfessors = computed(() => {
    const names = new Set<string>();
    for (const course of this.courses()) {
      names.add(resolveProfessorName(course));
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  });

  readonly filteredCourses = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    const profFilter = this.selectedProfessor().trim().toLowerCase();

    return this.courses().filter((course) => {
      const profName = resolveProfessorName(course);
      const matchesProf = !profFilter || profName.toLowerCase() === profFilter;
      const matchesQuery =
        !query ||
        course.name.toLowerCase().includes(query) ||
        profName.toLowerCase().includes(query) ||
        course.id.toLowerCase().includes(query);

      return matchesProf && matchesQuery;
    });
  });

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.loading.set(true);
    this.courseService.getCourses().subscribe({
      next: (data) => {
        this.courses.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  getProfessor(course: Course): string {
    return resolveProfessorName(course);
  }
}
