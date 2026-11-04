using TestInter.Application.DTOs.Enrollments;
using TestInter.Application.DTOs.Students;

namespace TestInter.Application.Contracts;

public interface IStudentApplicationService
{
    Task<StudentDto> CreateAsync(CreateStudentRequestDto request, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<StudentDto>> ListAsync(CancellationToken cancellationToken = default);
    Task<StudentDto?> GetByIdAsync(Guid studentId, CancellationToken cancellationToken = default);
    Task<StudentDto?> UpdateAsync(Guid studentId, UpdateStudentRequestDto request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid studentId, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<StudentEnrollmentSummaryDto>> ListEnrollmentSummariesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<MyCourseDetailsDto>> GetMyCourseDetailsAsync(Guid studentId, CancellationToken cancellationToken = default);
}
