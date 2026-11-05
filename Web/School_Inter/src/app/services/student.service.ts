import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  API_BASE_URL,
  CreateStudentRequest,
  Enrollment,
  MyCourseClassmate,
  MyCourseItem,
  Student,
  StudentCourseSummary,
  UpdateStudentRequest,
} from '../types/api.types';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  createStudent(payload: CreateStudentRequest): Observable<Student> {
    return this.http.post<unknown>(`${API_BASE_URL}/api/students`, payload).pipe(
      map((res) => this.normalizeStudent(res, payload))
    );
  }

  getStudents(): Observable<Student[]> {
    return this.http.get<unknown>(`${API_BASE_URL}/api/students`).pipe(
      map((res) => this.extractArray(res).map((item) => this.normalizeStudent(item)))
    );
  }

  getStudentById(id: string): Observable<Student> {
    return this.http.get<unknown>(`${API_BASE_URL}/api/students/${id}`).pipe(
      map((res) => this.normalizeStudent(res))
    );
  }

  updateStudent(id: string, payload: UpdateStudentRequest): Observable<Student> {
    const token = this.authService.getToken();
    const headers = token
      ? new HttpHeaders({
          Authorization: `Bearer ${this.authService.sanitizeBearerToken(token)}`,
        })
      : undefined;

    return this.http
      .put<unknown>(`${API_BASE_URL}/api/students/${id}`, payload, { headers })
      .pipe(map((res) => this.normalizeStudent(res, { fullName: payload.fullName, email: '', password: '', courseIds: payload.courseIds })));
  }

  deleteStudent(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/api/students/${id}`);
  }

  getEnrollments(): Observable<Enrollment[]> {
    return this.http.get<unknown>(`${API_BASE_URL}/api/students/enrollments`).pipe(
      map((res) => this.normalizeEnrollments(res))
    );
  }

  getMyCourses(): Observable<MyCourseItem[]> {
    return this.http.get<unknown>(`${API_BASE_URL}/api/students/me/courses`).pipe(
      map((res) => this.normalizeMyCourses(res))
    );
  }

  private normalizeStudent(raw: unknown, fallback?: CreateStudentRequest): Student {
    const unwrapped = this.unwrapObject(raw);
    const coursesRaw =
      (unwrapped['courses'] as unknown[]) ??
      (unwrapped['Courses'] as unknown[]) ??
      (unwrapped['enrollments'] as unknown[]) ??
      (unwrapped['Enrollments'] as unknown[]) ??
      [];

    const courses: StudentCourseSummary[] = Array.isArray(coursesRaw)
      ? coursesRaw.map((entry, idx) => {
          if (typeof entry === 'string') {
            return { id: entry, name: entry };
          }
          const rec = (entry ?? {}) as Record<string, unknown>;
          return {
            id: String(
              rec['id'] ?? rec['Id'] ?? rec['courseId'] ?? rec['CourseId'] ?? `course-${idx}`
            ),
            courseId: String(
              rec['courseId'] ?? rec['CourseId'] ?? rec['id'] ?? rec['Id'] ?? `course-${idx}`
            ),
            name: String(
              rec['name'] ??
                rec['Name'] ??
                rec['courseName'] ??
                rec['CourseName'] ??
                `Materia ${idx + 1}`
            ),
            professorName: (rec['professorName'] ??
              rec['ProfessorName'] ??
              rec['teacherName'] ??
              rec['TeacherName']) as string | undefined,
            credits: Number(rec['credits'] ?? rec['Credits'] ?? 3),
          };
        })
      : [];

    const rawCourseIds =
      (unwrapped['courseIds'] as unknown[]) ?? (unwrapped['CourseIds'] as unknown[]);

    const courseIds = Array.isArray(rawCourseIds)
      ? rawCourseIds.map((id) => String(id))
      : courses
          .map((c) => c.courseId || c.id)
          .filter((id): id is string => typeof id === 'string' && id.length > 0);

    return {
      id: String(
        unwrapped['id'] ??
          unwrapped['Id'] ??
          unwrapped['studentId'] ??
          unwrapped['StudentId'] ??
          ''
      ),
      fullName: String(
        unwrapped['fullName'] ??
          unwrapped['FullName'] ??
          unwrapped['name'] ??
          unwrapped['Name'] ??
          fallback?.fullName ??
          'Estudiante'
      ),
      email: String(
        unwrapped['email'] ?? unwrapped['Email'] ?? fallback?.email ?? 'sin-correo@campus.edu'
      ),
      credits: Number(
        unwrapped['credits'] ??
          unwrapped['Credits'] ??
          unwrapped['totalCredits'] ??
          unwrapped['TotalCredits'] ??
          (courseIds.length || fallback?.courseIds.length || 0) * 3
      ),
      courseIds: courseIds.length > 0 ? courseIds : fallback?.courseIds ?? [],
      courses,
      createdAt: (unwrapped['createdAt'] ?? unwrapped['CreatedAt']) as string | undefined,
    };
  }

  private normalizeEnrollments(payload: unknown): Enrollment[] {
    const rawList = this.extractArray(payload);

    return rawList.map((entry, idx) => {
      const rec = (entry ?? {}) as Record<string, unknown>;
      const nestedCourses =
        (rec['courses'] as unknown[]) ??
        (rec['Courses'] as unknown[]) ??
        (rec['enrolledCourses'] as unknown[]);

      const courses: StudentCourseSummary[] | undefined = Array.isArray(nestedCourses)
        ? nestedCourses.map((course, cIdx) => {
            if (typeof course === 'string') {
              return { name: course };
            }
            const cRec = (course ?? {}) as Record<string, unknown>;
            return {
              id: String(cRec['id'] ?? cRec['Id'] ?? cRec['courseId'] ?? `c-${cIdx}`),
              name: String(
                cRec['name'] ?? cRec['Name'] ?? cRec['courseName'] ?? cRec['CourseName'] ?? 'Materia'
              ),
              professorName: (cRec['professorName'] ??
                cRec['ProfessorName'] ??
                cRec['teacherName']) as string | undefined,
              credits: Number(cRec['credits'] ?? cRec['Credits'] ?? 3),
            };
          })
        : undefined;

      const studentsArr = (rec['students'] ?? rec['Students'] ?? rec['classmates']) as
        | unknown[]
        | undefined;

      return {
        id: String(rec['id'] ?? rec['Id'] ?? `enrollment-${idx}`),
        studentId: (rec['studentId'] ?? rec['StudentId']) as string | undefined,
        studentName: (rec['studentName'] ??
          rec['StudentName'] ??
          rec['fullName'] ??
          rec['FullName']) as string | undefined,
        studentEmail: (rec['studentEmail'] ?? rec['StudentEmail'] ?? rec['email'] ?? rec['Email']) as
          | string
          | undefined,
        courseId: (rec['courseId'] ?? rec['CourseId']) as string | undefined,
        courseName: (rec['courseName'] ?? rec['CourseName'] ?? rec['name'] ?? rec['Name']) as
          | string
          | undefined,
        professorName: (rec['professorName'] ??
          rec['ProfessorName'] ??
          rec['teacherName'] ??
          rec['TeacherName']) as string | undefined,
        credits:
          rec['credits'] !== undefined || rec['Credits'] !== undefined
            ? Number(rec['credits'] ?? rec['Credits'])
            : undefined,
        enrolledAt: (rec['enrolledAt'] ?? rec['EnrolledAt'] ?? rec['createdAt']) as
          | string
          | undefined,
        courses,
        students: Array.isArray(studentsArr)
          ? studentsArr.map((s) =>
              typeof s === 'string'
                ? s
                : String(
                    (s as Record<string, unknown>)['fullName'] ??
                      (s as Record<string, unknown>)['FullName'] ??
                      (s as Record<string, unknown>)['name'] ??
                      'Estudiante'
                  )
            )
          : undefined,
      };
    });
  }

  private normalizeMyCourses(payload: unknown): MyCourseItem[] {
    const rawList = this.extractArray(payload);

    return rawList.map((entry, idx) => {
      const rec = (entry ?? {}) as Record<string, unknown>;
      const classmatesRaw =
        (rec['classmatesFullNames'] as unknown[]) ??
        (rec['ClassmatesFullNames'] as unknown[]) ??
        (rec['classmates'] as unknown[]) ??
        (rec['Classmates'] as unknown[]) ??
        (rec['students'] as unknown[]) ??
        (rec['Students'] as unknown[]) ??
        (rec['companions'] as unknown[]) ??
        (rec['Companions'] as unknown[]) ??
        (rec['fellowStudents'] as unknown[]) ??
        [];

      const classmates: (MyCourseClassmate | string)[] = Array.isArray(classmatesRaw)
        ? classmatesRaw.map((mate) => {
            if (typeof mate === 'string') {
              return mate;
            }
            const mRec = (mate ?? {}) as Record<string, unknown>;
            return {
              id: (mRec['id'] ?? mRec['Id'] ?? mRec['studentId']) as string | undefined,
              fullName: String(
                mRec['fullName'] ??
                  mRec['FullName'] ??
                  mRec['name'] ??
                  mRec['Name'] ??
                  mRec['studentName'] ??
                  'Compañero'
              ),
              email: (mRec['email'] ?? mRec['Email']) as string | undefined,
            };
          })
        : [];

      return {
        id: String(rec['id'] ?? rec['Id'] ?? rec['courseId'] ?? rec['CourseId'] ?? `my-course-${idx}`),
        courseId: String(
          rec['courseId'] ?? rec['CourseId'] ?? rec['id'] ?? rec['Id'] ?? `my-course-${idx}`
        ),
        name: String(
          rec['name'] ??
            rec['Name'] ??
            rec['courseName'] ??
            rec['CourseName'] ??
            `Materia ${idx + 1}`
        ),
        professorName: String(
          rec['teacherFullName'] ??
            rec['TeacherFullName'] ??
            rec['professorName'] ??
            rec['ProfessorName'] ??
            rec['teacherName'] ??
            rec['TeacherName'] ??
            (rec['professor'] as Record<string, unknown> | undefined)?.['fullName'] ??
            (rec['professor'] as Record<string, unknown> | undefined)?.['name'] ??
            'Profesor asignado'
        ),
        credits: Number(rec['credits'] ?? rec['Credits'] ?? 3),
        classmates,
      };
    });
  }

  private unwrapObject(payload: unknown): Record<string, unknown> {
    if (!payload || typeof payload !== 'object') {
      return {};
    }
    const record = payload as Record<string, unknown>;
    if (record['data'] && typeof record['data'] === 'object' && !Array.isArray(record['data'])) {
      return record['data'] as Record<string, unknown>;
    }
    return record;
  }

  private extractArray(payload: unknown): unknown[] {
    if (Array.isArray(payload)) {
      return payload;
    }
    if (payload && typeof payload === 'object') {
      const record = payload as Record<string, unknown>;
      const candidates = [
        record['data'],
        record['items'],
        record['students'],
        record['enrollments'],
        record['courses'],
        record['result'],
      ];
      const found = candidates.find((entry) => Array.isArray(entry));
      if (Array.isArray(found)) {
        return found;
      }
    }
    return [];
  }
}
