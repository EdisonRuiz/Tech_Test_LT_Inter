import { Signal, computed, signal } from '@angular/core';
import { Course } from '../types/api.types';

export interface CourseSelectionState {
  selectedIds: Signal<string[]>;
  selectedCourses: Signal<Course[]>;
  selectedCount: Signal<number>;
  hasExactThree: Signal<boolean>;
  duplicateProfessors: Signal<string[]>;
  hasUniqueProfessors: Signal<boolean>;
  isValidSelection: Signal<boolean>;
  validationMessage: Signal<string>;
  isSelected: (courseId: string) => boolean;
  isProfessorConflict: (course: Course) => boolean;
  toggleCourse: (course: Course) => { changed: boolean; reason?: string };
  setSelectedIds: (ids: string[]) => void;
  clear: () => void;
}

export function resolveProfessorName(course: Course): string {
  if (course.professorName && course.professorName.trim()) {
    return course.professorName.trim();
  }
  if (course.teacherName && course.teacherName.trim()) {
    return course.teacherName.trim();
  }
  if (course.instructor && course.instructor.trim()) {
    return course.instructor.trim();
  }
  if (typeof course.professor === 'string' && course.professor.trim()) {
    return course.professor.trim();
  }
  if (course.professor && typeof course.professor === 'object') {
    const label = course.professor.fullName || course.professor.name;
    if (label && label.trim()) {
      return label.trim();
    }
  }
  return 'Profesor asignado';
}

export function resolveProfessorKey(course: Course): string {
  if (course.professorId && course.professorId.trim()) {
    return course.professorId.trim().toLowerCase();
  }
  if (course.professor && typeof course.professor === 'object' && course.professor.id) {
    return String(course.professor.id).trim().toLowerCase();
  }
  return resolveProfessorName(course).toLowerCase();
}

export function useCourseSelectionValidator(coursesSignal: Signal<Course[]>): CourseSelectionState {
  const selectedIds = signal<string[]>([]);

  const selectedCourses = computed(() => {
    const ids = new Set(selectedIds());
    return coursesSignal().filter((course) => ids.has(course.id));
  });

  const selectedCount = computed(() => selectedIds().length);
  const hasExactThree = computed(() => selectedCount() === 3);

  const duplicateProfessors = computed(() => {
    const counts = new Map<string, { label: string; total: number }>();
    for (const course of selectedCourses()) {
      const key = resolveProfessorKey(course);
      const label = resolveProfessorName(course);
      const current = counts.get(key);
      counts.set(key, {
        label,
        total: (current?.total ?? 0) + 1,
      });
    }

    return Array.from(counts.values())
      .filter((item) => item.total > 1)
      .map((item) => item.label);
  });

  const hasUniqueProfessors = computed(() => duplicateProfessors().length === 0);

  const isValidSelection = computed(() => hasExactThree() && hasUniqueProfessors());

  const validationMessage = computed(() => {
    const count = selectedCount();
    const duplicates = duplicateProfessors();

    if (duplicates.length > 0) {
      return `Conflicto de profesor: no puedes repetir docente (${duplicates.join(', ')}).`;
    }
    if (count === 0) {
      return 'Selecciona exactamente 3 materias de profesores distintos (9 créditos en total).';
    }
    if (count < 3) {
      const remaining = 3 - count;
      return `Has seleccionado ${count}/3 materias. Te ${
        remaining === 1 ? 'falta 1 materia' : `faltan ${remaining} materias`
      }.`;
    }
    if (count > 3) {
      return `Has seleccionado ${count} materias. Solo se permiten exactamente 3.`;
    }
    return 'Selección válida: 3 materias con profesores diferentes.';
  });

  const isSelected = (courseId: string): boolean => selectedIds().includes(courseId);

  const isProfessorConflict = (course: Course): boolean => {
    if (isSelected(course.id)) {
      return false;
    }
    const targetKey = resolveProfessorKey(course);
    return selectedCourses().some((selected) => resolveProfessorKey(selected) === targetKey);
  };

  const toggleCourse = (course: Course): { changed: boolean; reason?: string } => {
    const current = selectedIds();
    if (current.includes(course.id)) {
      selectedIds.set(current.filter((id) => id !== course.id));
      return { changed: true };
    }

    if (current.length >= 3) {
      return {
        changed: false,
        reason: 'Ya seleccionaste el máximo de 3 materias. Desmarca una para elegir otra.',
      };
    }

    const candidateKey = resolveProfessorKey(course);
    const conflictCourse = selectedCourses().find(
      (item) => resolveProfessorKey(item) === candidateKey
    );

    if (conflictCourse) {
      return {
        changed: false,
        reason: `No puedes elegir dos materias con el mismo profesor (${resolveProfessorName(
          course
        )}).`,
      };
    }

    selectedIds.set([...current, course.id]);
    return { changed: true };
  };

  const setSelectedIds = (ids: string[]): void => {
    selectedIds.set([...ids]);
  };

  const clear = (): void => {
    selectedIds.set([]);
  };

  return {
    selectedIds,
    selectedCourses,
    selectedCount,
    hasExactThree,
    duplicateProfessors,
    hasUniqueProfessors,
    isValidSelection,
    validationMessage,
    isSelected,
    isProfessorConflict,
    toggleCourse,
    setSelectedIds,
    clear,
  };
}
