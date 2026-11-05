import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { StudentEditorComponent } from '../../components/student-editor/student-editor.component';
import { AuthService, AuthUser } from '../../services/auth.service';
import { CourseService } from '../../services/course.service';
import { NotificationService } from '../../services/notification.service';
import { StudentService } from '../../services/student.service';
import { MyCourseItem } from '../../types/api.types';
import { MyCoursesComponent } from './my-courses.component';

describe('MyCoursesComponent enrollment', () => {
  const currentUser = signal<AuthUser | null>(null);
  const studentService = { getMyCourses: vi.fn(), getStudentById: vi.fn(), updateStudent: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    currentUser.set({ id: 'self-1', email: 'ana@campus.edu', fullName: 'Ana Perez' });
    studentService.getMyCourses.mockReturnValue(of([]));
    studentService.getStudentById.mockReturnValue(of({ ...currentUser(), courseIds: [] }));
    studentService.updateStudent.mockReturnValue(of({ ...currentUser() }));
    TestBed.configureTestingModule({
      imports: [MyCoursesComponent],
      providers: [
        provideRouter([]),
        { provide: StudentService, useValue: studentService },
        { provide: AuthService, useValue: { currentUser, isAdmin: () => false } },
        { provide: CourseService, useValue: { getCourses: () => of([]) } },
        { provide: NotificationService, useValue: { success: vi.fn(), warning: vi.fn() } },
      ],
    });
  });

  it('opens the shared editor for the current student and refreshes classes after saving', () => {
    const fixture = TestBed.createComponent(MyCoursesComponent);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.empty-state button') as HTMLButtonElement;
    expect(button.textContent).toContain('Matricular');
    button.click();
    fixture.detectChanges();

    const editor = fixture.debugElement.query(By.directive(StudentEditorComponent)).componentInstance as StudentEditorComponent;
    expect(editor.studentId()).toBe('self-1');
    expect(editor.enrollmentOnly()).toBe(true);
    expect(studentService.getStudentById).toHaveBeenCalledWith('self-1');
    const enrolled: MyCourseItem[] = [{ id: 'course-1', name: 'Matematicas', classmates: [] }];
    studentService.getMyCourses.mockReturnValue(of(enrolled));
    editor.saved.emit();
    fixture.detectChanges();

    expect(studentService.getMyCourses).toHaveBeenCalledTimes(2);
    expect(fixture.debugElement.query(By.directive(StudentEditorComponent))).toBeNull();
    expect(fixture.nativeElement.querySelector('.my-course-card').textContent).toContain('Matematicas');
  });

  it('does not offer enrollment when only the search has no matches', () => {
    studentService.getMyCourses.mockReturnValue(of([{ id: 'course-1', name: 'Matematicas' }]));
    const fixture = TestBed.createComponent(MyCoursesComponent);
    fixture.detectChanges();
    fixture.componentInstance.searchTerm.set('no-match');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.empty-state').textContent).toContain('Limpiar filtro');
    expect(fixture.nativeElement.querySelector('.empty-state').textContent).not.toContain('Matricular');
    fixture.componentInstance.openEnrollment();
    expect(fixture.componentInstance.enrollmentStudentId()).toBeNull();
  });

  it('shows a loading error rather than offering enrollment after a failed request', () => {
    studentService.getMyCourses.mockReturnValue(throwError(() => ({ message: 'Service unavailable' })));
    const fixture = TestBed.createComponent(MyCoursesComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Service unavailable');
    expect(fixture.nativeElement.textContent).not.toContain('Matricular');
  });

  it('does not open the editor without the current student ID', () => {
    currentUser.set({ email: 'ana@campus.edu' });
    const fixture = TestBed.createComponent(MyCoursesComponent);
    fixture.detectChanges();
    fixture.componentInstance.openEnrollment();
    fixture.detectChanges();

    expect(fixture.componentInstance.enrollmentStudentId()).toBeNull();
    expect(studentService.getStudentById).not.toHaveBeenCalled();
    expect(fixture.componentInstance.enrollmentError()).toBeTruthy();
  });
});