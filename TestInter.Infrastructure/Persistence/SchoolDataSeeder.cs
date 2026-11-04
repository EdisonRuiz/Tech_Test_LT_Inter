using Microsoft.EntityFrameworkCore;
using TestInter.Application.Contracts.Security;
using TestInter.Domain.Entities;
using TestInter.Domain.ValueObjects;

namespace TestInter.Infrastructure.Persistence;

public sealed class SchoolDataSeeder
{
    private readonly SchoolDbContext _dbContext;
    private readonly IPasswordHasher _passwordHasher;

    public SchoolDataSeeder(SchoolDbContext dbContext, IPasswordHasher passwordHasher)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await _dbContext.Database.EnsureCreatedAsync(cancellationToken);

        if (await _dbContext.Students.AnyAsync(cancellationToken))
        {
            return;
        }

        var student = new Student(
            Guid.Parse("30000000-0000-0000-0000-000000000001"),
            "Default Student",
            new EmailAddress("student1@school.com"),
            _passwordHasher.Hash("Pass123!"));

        var selectedCourses = await _dbContext.Courses
            .Where(course => course.Id == Guid.Parse("20000000-0000-0000-0000-000000000001")
                || course.Id == Guid.Parse("20000000-0000-0000-0000-000000000003")
                || course.Id == Guid.Parse("20000000-0000-0000-0000-000000000005"))
            .ToArrayAsync(cancellationToken);

        student.ReplaceEnrollments(selectedCourses);

        await _dbContext.Students.AddAsync(student, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
