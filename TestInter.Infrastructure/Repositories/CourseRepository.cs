using Microsoft.EntityFrameworkCore;
using TestInter.Domain.Entities;
using TestInter.Domain.Repositories;
using TestInter.Infrastructure.Persistence;

namespace TestInter.Infrastructure.Repositories;

public sealed class CourseRepository : ICourseRepository
{
    private readonly SchoolDbContext _dbContext;

    public CourseRepository(SchoolDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyCollection<Course>> ListAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Courses.OrderBy(course => course.Name).ToArrayAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<Course>> GetByIdsAsync(IReadOnlyCollection<Guid> ids, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Courses.Where(course => ids.Contains(course.Id)).ToArrayAsync(cancellationToken);
    }

    public async Task<Course?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Courses.FirstOrDefaultAsync(course => course.Id == id, cancellationToken);
    }
}
