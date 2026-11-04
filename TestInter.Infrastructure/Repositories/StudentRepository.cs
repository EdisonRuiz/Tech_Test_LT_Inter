using Microsoft.EntityFrameworkCore;
using TestInter.Domain.Entities;
using TestInter.Domain.Repositories;
using TestInter.Infrastructure.Persistence;

namespace TestInter.Infrastructure.Repositories;

public sealed class StudentRepository : IStudentRepository
{
    private readonly SchoolDbContext _dbContext;

    public StudentRepository(SchoolDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(Student student, CancellationToken cancellationToken = default)
    {
        await _dbContext.Students.AddAsync(student, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<Student?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Students
            .Include(student => student.Enrollments)
            .FirstOrDefaultAsync(student => student.Id == id, cancellationToken);
    }

    public async Task<Student?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        try
        {
            return await _dbContext.Students
            .FirstOrDefaultAsync(student => student.Email.Value == normalizedEmail, cancellationToken);
        }
        catch (Exception ex)
        {
            throw;
        }
        
    }

    public async Task<IReadOnlyCollection<Student>> ListAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Students
            .Include(student => student.Enrollments)
            .OrderBy(student => student.FullName)
            .ToArrayAsync(cancellationToken);
    }

    public async Task UpdateAsync(Student student, CancellationToken cancellationToken = default)
    {
        var studentId = student.Id;
        var fullName = student.FullName;
        var enrollments = student.Enrollments
            .Select(enrollment => new Enrollment(enrollment.Id, studentId, enrollment.CourseId, enrollment.RegisteredAt))
            .ToArray();

        _dbContext.ChangeTracker.Clear();

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        var updatedStudents = await _dbContext.Students
            .Where(currentStudent => currentStudent.Id == studentId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(currentStudent => currentStudent.FullName, fullName), cancellationToken);

        if (updatedStudents == 0)
            throw new DbUpdateConcurrencyException($"Student '{studentId}' no longer exists.");

        await _dbContext.Enrollments
            .Where(enrollment => enrollment.StudentId == studentId)
            .ExecuteDeleteAsync(cancellationToken);

        await _dbContext.Enrollments.AddRangeAsync(enrollments, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        await transaction.CommitAsync(cancellationToken);
    }

    public async Task DeleteAsync(Student student, CancellationToken cancellationToken = default)
    {
        _dbContext.Students.Remove(student);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
