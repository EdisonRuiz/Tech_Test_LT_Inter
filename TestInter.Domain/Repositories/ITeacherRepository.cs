using TestInter.Domain.Entities;

namespace TestInter.Domain.Repositories;

public interface ITeacherRepository
{
    Task<IReadOnlyCollection<Teacher>> ListAsync(CancellationToken cancellationToken = default);
    Task<Teacher?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
