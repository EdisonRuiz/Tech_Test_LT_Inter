namespace TestInter.Application.DTOs.Enrollments;

public sealed record MyCourseDetailsDto(
    Guid CourseId,
    string CourseName,
    string TeacherFullName,
    IReadOnlyCollection<string> ClassmatesFullNames);
