using Microsoft.EntityFrameworkCore;
using TestInter.Domain.Entities;
using TestInter.Domain.Repositories;
using TestInter.Infrastructure.Persistence;

namespace TestInter.Infrastructure.Repositories;

public sealed class TeacherRepository : ITeacherRepository
{
    private readonly SchoolDbContext _dbContext;

    public TeacherRepository(SchoolDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyCollection<Teacher>> ListAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Teachers.OrderBy(teacher => teacher.FullName).ToArrayAsync(cancellationToken);
    }

    public async Task<Teacher?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Teachers.FirstOrDefaultAsync(teacher => teacher.Id == id, cancellationToken);
    }
}
