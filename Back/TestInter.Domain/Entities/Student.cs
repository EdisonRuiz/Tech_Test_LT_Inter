using TestInter.Domain.Exceptions;
using TestInter.Domain.ValueObjects;

namespace TestInter.Domain.Entities;

public sealed class Student
{
    private readonly List<Enrollment> _enrollments = [];

    public Guid Id { get; private set; }
    public string FullName { get; private set; }
    public EmailAddress Email { get; private set; }
    public string PasswordHash { get; private set; }
    public IReadOnlyCollection<Enrollment> Enrollments => _enrollments.AsReadOnly();

    public Student(Guid id, string fullName, EmailAddress email, string passwordHash)
    {
        if (id == Guid.Empty)
        {
            throw new DomainException("Student id is required.");
        }

        if (string.IsNullOrWhiteSpace(fullName))
        {
            throw new DomainException("Student full name is required.");
        }

        if (string.IsNullOrWhiteSpace(passwordHash))
        {
            throw new DomainException("Student password hash is required.");
        }

        Id = id;
        FullName = fullName.Trim();
        Email = email;
        PasswordHash = passwordHash;
    }

    private Student()
    {
        FullName = string.Empty;
        Email = new EmailAddress("placeholder@local.test");
        PasswordHash = string.Empty;
    }

    public void ChangeFullName(string fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName))
        {
            throw new DomainException("Student full name is required.");
        }

        FullName = fullName.Trim();
    }

    public void ReplaceEnrollments(IReadOnlyCollection<Course> courses)
    {
        if (courses.Count != 3)
        {
            throw new DomainException("Student must register exactly 3 courses.");
        }

        if (courses.Select(course => course.Id).Distinct().Count() != 3)
        {
            throw new DomainException("Student cannot register duplicated courses.");
        }

        if (courses.Select(course => course.TeacherId).Distinct().Count() != 3)
        {
            throw new DomainException("Student cannot register courses from the same teacher.");
        }

        _enrollments.Clear();
        var timestamp = DateTimeOffset.UtcNow;
        foreach (var course in courses)
        {
            _enrollments.Add(new Enrollment(Guid.NewGuid(), Id, course.Id, timestamp));
        }
    }
}
