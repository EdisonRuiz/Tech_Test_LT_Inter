namespace TestInter.Application.DTOs.Enrollments;

public sealed record StudentEnrollmentSummaryDto(
    Guid StudentId,
    string StudentFullName,
    IReadOnlyCollection<CourseEnrollmentDto> Courses);

public sealed record CourseEnrollmentDto(Guid CourseId, string CourseName, string TeacherFullName);
