using System.Reflection;
using TestInter.Application.Contracts;
using TestInter.Application.Contracts.Security;
using TestInter.Application.DTOs.Enrollments;
using TestInter.Application.DTOs.Students;
using TestInter.Domain.Entities;
using TestInter.Domain.Exceptions;
using TestInter.Domain.Repositories;
using TestInter.Domain.ValueObjects;

namespace TestInter.Application.Services;

public sealed class StudentApplicationService : IStudentApplicationService
{
    private readonly IStudentRepository _studentRepository;
    private readonly ICourseRepository _courseRepository;
    private readonly ITeacherRepository _teacherRepository;
    private readonly IPasswordHasher _passwordHasher;

    public StudentApplicationService(
        IStudentRepository studentRepository,
        ICourseRepository courseRepository,
        ITeacherRepository teacherRepository,
        IPasswordHasher passwordHasher)
    {
        _studentRepository = studentRepository;
        _courseRepository = courseRepository;
        _teacherRepository = teacherRepository;
        _passwordHasher = passwordHasher;
    }

    public async Task<StudentDto> CreateAsync(CreateStudentRequestDto request, CancellationToken cancellationToken = default)
    {
        var existingStudent = await _studentRepository.GetByEmailAsync(request.Email, cancellationToken);
        if (existingStudent is not null)
        {
            throw new DomainException("Email is already registered.");
        }

        var student = new Student(Guid.NewGuid(), request.FullName, new EmailAddress(request.Email), _passwordHasher.Hash(request.Password)); 
        await _studentRepository.AddAsync(student, cancellationToken);
        return ToDto(student);
    }

    public async Task<IReadOnlyCollection<StudentDto>> ListAsync(CancellationToken cancellationToken = default)
    {
        var students = await _studentRepository.ListAsync(cancellationToken);
        return students.Select(student => ToDto(student, maskEmail: true)).ToArray();
    }

    public async Task<StudentDto?> GetByIdAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        var student = await _studentRepository.GetByIdAsync(studentId, cancellationToken);
        return student is null ? null : ToDto(student);
    }

    public async Task<StudentDto?> UpdateAsync(Guid studentId, UpdateStudentRequestDto request, CancellationToken cancellationToken = default)
    {
        var student = await _studentRepository.GetByIdAsync(studentId, cancellationToken);
        if (student is null)
        {
            return null;
        }

        var selectedCourses = await _courseRepository.GetByIdsAsync(request.CourseIds, cancellationToken);
        if (selectedCourses.Count != request.CourseIds.Count)
        {
            throw new DomainException("One or more selected courses do not exist.");
        }

        student.ReplaceEnrollments(selectedCourses);
        student.ChangeFullName(request.FullName);

        await _studentRepository.UpdateAsync(student, cancellationToken);
        return ToDto(student);
    }

    public async Task<bool> DeleteAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        var student = await _studentRepository.GetByIdAsync(studentId, cancellationToken);
        if (student is null)
        {
            return false;
        }

        await _studentRepository.DeleteAsync(student, cancellationToken);
        return true;
    }

    public async Task<IReadOnlyCollection<StudentEnrollmentSummaryDto>> ListEnrollmentSummariesAsync(CancellationToken cancellationToken = default)
    {
        var students = await _studentRepository.ListAsync(cancellationToken);
        var courses = await _courseRepository.ListAsync(cancellationToken);
        var teachers = await _teacherRepository.ListAsync(cancellationToken);

        var courseById = courses.ToDictionary(course => course.Id);
        var teacherById = teachers.ToDictionary(teacher => teacher.Id);

        return students.Select(student =>
        {
            var enrolledCourses = student.Enrollments
                .Select(enrollment => courseById[enrollment.CourseId])
                .Select(course => new CourseEnrollmentDto(course.Id, course.Name, teacherById[course.TeacherId].FullName))
                .ToArray();

            return new StudentEnrollmentSummaryDto(student.Id, student.FullName, enrolledCourses);
        }).ToArray();
    }

    public async Task<IReadOnlyCollection<MyCourseDetailsDto>> GetMyCourseDetailsAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        var students = await _studentRepository.ListAsync(cancellationToken);
        var courses = await _courseRepository.ListAsync(cancellationToken);
        var teachers = await _teacherRepository.ListAsync(cancellationToken);

        var myStudent = students.FirstOrDefault(student => student.Id == studentId)
            ?? throw new DomainException("Student not found.");

        var courseById = courses.ToDictionary(course => course.Id);
        var teacherById = teachers.ToDictionary(teacher => teacher.Id);

        return myStudent.Enrollments.Select(enrollment =>
        {
            var course = courseById[enrollment.CourseId];
            var classmates = students
                .Where(student => student.Id != myStudent.Id && student.Enrollments.Any(shared => shared.CourseId == course.Id))
                .Select(student => student.FullName)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            return new MyCourseDetailsDto(course.Id, course.Name, teacherById[course.TeacherId].FullName, classmates);
        }).ToArray();
    }

    private static StudentDto ToDto(Student student, bool maskEmail = false)
    {
        string email = maskEmail ? MaskEmail(student.Email.Value) : student.Email.Value;
        return new StudentDto(student.Id, student.FullName, email);
    }

    public static string MaskEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return string.Empty;

        // Si tiene 3 caracteres o menos, no podemos dejar 3 visibles sin exponerlo todo
        if (email.Length <= 3)
        {
            return new string('*', email.Length);
        }

        // Toma los primeros 3 caracteres y completa el resto con asteriscos
        string visiblePart = email.Substring(0, 3);
        int remainingLength = email.Length - 3;

        return visiblePart + new string('*', remainingLength);
    }
}
