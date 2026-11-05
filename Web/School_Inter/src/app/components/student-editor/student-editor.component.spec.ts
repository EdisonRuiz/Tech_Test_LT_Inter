import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CourseService } from '../../services/course.service';
import { NotificationService } from '../../services/notification.service';
import { StudentService } from '../../services/student.service';
import { Course, Student } from '../../types/api.types';
import { StudentEditorComponent } from './student-editor.component';

describe('StudentEditorComponent', () => {
  const student: Student = { id: 'self-1', fullName: 'Ana Perez', email: 'ana@campus.edu', courseIds: [] };
  const courses: Course[] = [
    { id: 'course-1', name: 'Matematicas', professorId: 'teacher-1' },
    { id: 'course-2', name: 'Fisica', professorId: 'teacher-2' },
    { id: 'course-3', name: 'Programacion', professorId: 'teacher-3' },
    { id: 'course-4', name: 'Calculo', professorId: 'teacher-1' },
  ];
  const studentService = {
    getStudentById: vi.fn(),
    updateStudent: vi.fn(),
  };
  const notifications = { success: vi.fn(), warning: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    studentService.getStudentById.mockReturnValue(of(student));
    studentService.updateStudent.mockReturnValue(of(student));
    TestBed.configureTestingModule({
      imports: [StudentEditorComponent],
      providers: [
        provideRouter([]),
        { provide: StudentService, useValue: studentService },
        { provide: CourseService, useValue: { getCourses: () => of(courses) } },
        { provide: AuthService, useValue: { isAdmin: () => false } },
        { provide: NotificationService, useValue: notifications },
      ],
    });
  });

  function createEditor(enrollmentOnly = true) {
    const fixture = TestBed.createComponent(StudentEditorComponent);
    fixture.componentRef.setInput('studentId', 'self-1');
    fixture.componentRef.setInput('enrollmentOnly', enrollmentOnly);
    fixture.detectChanges();
    return fixture;
  }

  it('uses the existing update operation to enroll the selected student and emits saved', () => {
    const fixture = createEditor();
    const editor = fixture.componentInstance;
    const saved = vi.fn();
    editor.saved.subscribe(saved);
    courses.slice(0, 3).forEach((course) => editor.toggleCourse(course));
    editor.submit();

    expect(studentService.getStudentById).toHaveBeenCalledWith('self-1');
    expect(studentService.updateStudent).toHaveBeenCalledWith('self-1', {
      fullName: student.fullName,
      courseIds: ['course-1', 'course-2', 'course-3'],
    });
    expect(saved).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelector('#editFullName')).toBeNull();
  });

  it('requires three courses with distinct professors', () => {
    const editor = createEditor().componentInstance;
    editor.toggleCourse(courses[0]);
    editor.toggleCourse(courses[3]);
    editor.submit();

    expect(editor.courseSelection.selectedIds()).toEqual(['course-1']);
    expect(notifications.warning).toHaveBeenCalledOnce();
    expect(studentService.updateStudent).not.toHaveBeenCalled();
  });

  it('preselects current courses and allows editing the name in admin mode', () => {
    studentService.getStudentById.mockReturnValue(of({ ...student, courseIds: ['course-1', 'course-2', 'course-3'] }));
    const fixture = createEditor(false);
    fixture.componentInstance.editForm.controls.fullName.setValue('Ana Gomez');
    fixture.componentInstance.submit();

    expect(fixture.nativeElement.querySelector('#editFullName')).not.toBeNull();
    expect(studentService.updateStudent).toHaveBeenCalledWith('self-1', {
      fullName: 'Ana Gomez', courseIds: ['course-1', 'course-2', 'course-3'],
    });
  });

  it('keeps the selection open when saving fails and does not expose admin log links', () => {
    studentService.updateStudent.mockReturnValue(throwError(() => ({ message: 'Save failed', logId: 'log-1' })));
    const fixture = createEditor();
    const editor = fixture.componentInstance;
    const saved = vi.fn();
    editor.saved.subscribe(saved);
    courses.slice(0, 3).forEach((course) => editor.toggleCourse(course));
    editor.submit();
    fixture.detectChanges();

    expect(saved).not.toHaveBeenCalled();
    expect(editor.saving()).toBe(false);
    expect(editor.courseSelection.selectedCount()).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('Save failed');
    expect(fixture.nativeElement.querySelector('a[href="/logs/log-1"]')).toBeNull();
  });
});