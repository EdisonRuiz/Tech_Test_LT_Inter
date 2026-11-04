using TestInter.Domain.Exceptions;

namespace TestInter.Domain.Entities;

public sealed class Teacher
{
    public Guid Id { get; private set; }
    public string FullName { get; private set; }

    public Teacher(Guid id, string fullName)
    {
        if (id == Guid.Empty)
        {
            throw new DomainException("Teacher id is required.");
        }

        if (string.IsNullOrWhiteSpace(fullName))
        {
            throw new DomainException("Teacher name is required.");
        }

        Id = id;
        FullName = fullName.Trim();
    }

    private Teacher()
    {
        FullName = string.Empty;
    }
}
