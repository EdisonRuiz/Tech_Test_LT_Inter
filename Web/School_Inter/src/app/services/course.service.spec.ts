import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { resolveProfessorName } from '../hooks/use-course-selection';
import { API_BASE_URL } from '../types/api.types';
import { CourseService } from './course.service';

describe('CourseService', () => {
  let service: CourseService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CourseService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it.each(['teacherFullName', 'TeacherFullName', 'professorName'])(
    'uses %s from the API as the displayed professor name',
    (property) => {
      let professorName: string | undefined;
      service.getCourses().subscribe((courses) => {
        professorName = resolveProfessorName(courses[0]);
      });

      httpTesting.expectOne(`${API_BASE_URL}/api/courses`).flush([
        { id: 'course-1', name: 'Matematicas', [property]: '  Ana Perez  ' },
      ]);

      expect(professorName).toBe('Ana Perez');
    }
  );

  it('keeps the fallback when the API does not include a professor name', () => {
    let professorName: string | undefined;
    service.getCourses().subscribe((courses) => {
      professorName = resolveProfessorName(courses[0]);
    });

    httpTesting.expectOne(`${API_BASE_URL}/api/courses`).flush([
      { id: 'course-1', name: 'Matematicas' },
    ]);

    expect(professorName).toBe('Profesor por definir');
  });
});