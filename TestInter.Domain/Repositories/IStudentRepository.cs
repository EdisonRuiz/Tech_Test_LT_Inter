using TestInter.Domain.Entities;

namespace TestInter.Domain.Repositories;

public interface IStudentRepository
{
    Task AddAsync(Student student, CancellationToken cancellationToken = default);
    Task<Student?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Student?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<Student>> ListAsync(CancellationToken cancellationToken = default);
    Task UpdateAsync(Student student, CancellationToken cancellationToken = default);
    Task DeleteAsync(Student student, CancellationToken cancellationToken = default);
}
