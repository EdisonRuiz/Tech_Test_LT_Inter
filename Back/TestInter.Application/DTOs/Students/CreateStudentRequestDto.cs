namespace TestInter.Application.DTOs.Students;

public sealed record CreateStudentRequestDto(
    string FullName,
    string Email,
    string Password,
    IReadOnlyCollection<Guid> CourseIds);
