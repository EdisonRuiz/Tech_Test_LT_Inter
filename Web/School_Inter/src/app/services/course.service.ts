import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL, Course } from '../types/api.types';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private readonly http = inject(HttpClient);

  getCourses(): Observable<Course[]> {
    return this.http.get<unknown>(`${API_BASE_URL}/api/courses`).pipe(
      map((response) => this.normalizeCourses(response))
    );
  }

  getProfessorLabel(course: Course): string {
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
      const name = course.professor.fullName || course.professor.name;
      if (name && name.trim()) {
        return name.trim();
      }
    }
    return 'Profesor asignado';
  }

  getProfessorKey(course: Course): string {
    if (course.professorId && course.professorId.trim()) {
      return course.professorId.trim().toLowerCase();
    }
    if (course.professor && typeof course.professor === 'object' && course.professor.id) {
      return String(course.professor.id).trim().toLowerCase();
    }
    return this.getProfessorLabel(course).toLowerCase();
  }

  private normalizeCourses(payload: unknown): Course[] {
    const rawList = this.extractArray(payload);

    return rawList.map((item, index) => {
      const record = (item ?? {}) as Record<string, unknown>;
      const professorObj = record['professor'] as Record<string, unknown> | string | undefined;

      const professorName =
        (record['professorName'] as string | undefined) ||
        (record['ProfessorName'] as string | undefined) ||
        (record['teacherName'] as string | undefined) ||
        (record['TeacherName'] as string | undefined) ||
        (record['instructor'] as string | undefined) ||
        (typeof professorObj === 'string'
          ? professorObj
          : (professorObj?.['fullName'] as string | undefined) ||
            (professorObj?.['name'] as string | undefined) ||
            (professorObj?.['FullName'] as string | undefined));

      const professorId =
        (record['professorId'] as string | undefined) ||
        (record['ProfessorId'] as string | undefined) ||
        (record['teacherId'] as string | undefined) ||
        (typeof professorObj === 'object' && professorObj
          ? ((professorObj['id'] || professorObj['Id']) as string | undefined)
          : undefined);

      return {
        id: String(
          record['id'] ??
            record['Id'] ??
            record['courseId'] ??
            record['CourseId'] ??
            `course-${index}`
        ),
        name: String(
          record['name'] ??
            record['Name'] ??
            record['courseName'] ??
            record['CourseName'] ??
            `Materia ${index + 1}`
        ),
        credits: Number(record['credits'] ?? record['Credits'] ?? 3),
        professorId: professorId ? String(professorId) : undefined,
        professorName: professorName ? String(professorName) : 'Profesor por definir',
        description: (record['description'] ?? record['Description']) as string | undefined,
      };
    });
  }

  private extractArray(payload: unknown): unknown[] {
    if (Array.isArray(payload)) {
      return payload;
    }
    if (payload && typeof payload === 'object') {
      const record = payload as Record<string, unknown>;
      const candidates = [record['data'], record['items'], record['courses'], record['result']];
      const found = candidates.find((entry) => Array.isArray(entry));
      if (Array.isArray(found)) {
        return found;
      }
    }
    return [];
  }
}
