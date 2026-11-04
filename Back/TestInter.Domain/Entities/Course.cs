using TestInter.Domain.Exceptions;

namespace TestInter.Domain.Entities;

public sealed class Course
{
    public Guid Id { get; private set; }
    public string Name { get; private set; }
    public int Credits { get; private set; }
    public Guid TeacherId { get; private set; }

    public Course(Guid id, string name, int credits, Guid teacherId)
    {
        if (id == Guid.Empty)
        {
            throw new DomainException("Course id is required.");
        }

        if (teacherId == Guid.Empty)
        {
            throw new DomainException("Teacher id is required for course.");
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainException("Course name is required.");
        }

        if (credits <= 0)
        {
            throw new DomainException("Course credits must be greater than zero.");
        }

        Id = id;
        Name = name.Trim();
        Credits = credits;
        TeacherId = teacherId;
    }

    private Course()
    {
        Name = string.Empty;
    }
}
