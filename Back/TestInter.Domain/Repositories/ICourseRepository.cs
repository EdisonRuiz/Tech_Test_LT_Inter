using TestInter.Domain.Entities;

namespace TestInter.Domain.Repositories;

public interface ICourseRepository
{
    Task<IReadOnlyCollection<Course>> ListAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<Course>> GetByIdsAsync(IReadOnlyCollection<Guid> ids, CancellationToken cancellationToken = default);
    Task<Course?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
