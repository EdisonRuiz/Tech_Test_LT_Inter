using TestInter.Domain.Exceptions;

namespace TestInter.Domain.Entities;

public sealed class Enrollment
{
    public Guid Id { get; private set; }
    public Guid StudentId { get; private set; }
    public Guid CourseId { get; private set; }
    public DateTimeOffset RegisteredAt { get; private set; }

    public Enrollment(Guid id, Guid studentId, Guid courseId, DateTimeOffset registeredAt)
    {
        if (id == Guid.Empty)
        {
            throw new DomainException("Enrollment id is required.");
        }

        if (studentId == Guid.Empty)
        {
            throw new DomainException("Student id is required for enrollment.");
        }

        if (courseId == Guid.Empty)
        {
            throw new DomainException("Course id is required for enrollment.");
        }

        Id = id;
        StudentId = studentId;
        CourseId = courseId;
        RegisteredAt = registeredAt;
    }

    private Enrollment()
    {
    }
}
