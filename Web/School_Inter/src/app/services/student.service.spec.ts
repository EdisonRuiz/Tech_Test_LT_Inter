import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL, MyCourseItem } from '../types/api.types';
import { AuthService } from './auth.service';
import { StudentService } from './student.service';

describe('StudentService', () => {
  let service: StudentService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: {} },
      ],
    });
    service = TestBed.inject(StudentService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it.each(['teacherFullName', 'TeacherFullName', 'professorName'])(
    'maps %s from the API to the professor name displayed by the page',
    (property) => {
      let professorName: string | undefined;
      service.getMyCourses().subscribe((courses) => {
        professorName = courses[0].professorName;
      });

      httpTesting.expectOne(`${API_BASE_URL}/api/students/me/courses`).flush([
        { courseId: 'course-1', courseName: 'Matematicas', [property]: 'Ana Perez' },
      ]);

      expect(professorName).toBe('Ana Perez');
    }
  );

  it('keeps the professor fallback when the API does not include a name', () => {
    let professorName: string | undefined;
    service.getMyCourses().subscribe((courses) => {
      professorName = courses[0].professorName;
    });

    httpTesting.expectOne(`${API_BASE_URL}/api/students/me/courses`).flush([
      { courseId: 'course-1', courseName: 'Matematicas' },
    ]);

    expect(professorName).toBe('Profesor asignado');
  });

  it.each(['classmatesFullNames', 'ClassmatesFullNames', 'classmates', 'students'])(
    'maps %s from the API to the classmates displayed by the page',
    (property) => {
      let classmates: MyCourseItem['classmates'];
      service.getMyCourses().subscribe((courses) => {
        classmates = courses[0].classmates;
      });

      httpTesting.expectOne(`${API_BASE_URL}/api/students/me/courses`).flush([
        { courseId: 'course-1', courseName: 'Matematicas', [property]: ['Ana Perez', 'Carlos Ruiz'] },
      ]);

      expect(classmates).toEqual(['Ana Perez', 'Carlos Ruiz']);
    }
  );

  it('keeps an empty classmates list when classmatesFullNames is empty', () => {
    let classmates: MyCourseItem['classmates'];
    service.getMyCourses().subscribe((courses) => {
      classmates = courses[0].classmates;
    });

    httpTesting.expectOne(`${API_BASE_URL}/api/students/me/courses`).flush([
      { courseId: 'course-1', courseName: 'Matematicas', classmatesFullNames: [] },
    ]);

    expect(classmates).toEqual([]);
  });
});