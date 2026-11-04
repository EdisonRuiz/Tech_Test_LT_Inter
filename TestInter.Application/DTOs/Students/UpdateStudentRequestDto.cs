namespace TestInter.Application.DTOs.Students;

public sealed record UpdateStudentRequestDto(string FullName, IReadOnlyCollection<Guid> CourseIds);
