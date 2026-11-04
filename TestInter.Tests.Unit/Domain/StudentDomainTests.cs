using FluentAssertions;
using TestInter.Domain.Entities;
using TestInter.Domain.Exceptions;
using TestInter.Domain.ValueObjects;

namespace TestInter.Tests.Unit.Domain;

public sealed class StudentDomainTests
{
    [Fact]
    public void ReplaceEnrollments_ShouldThrow_WhenCourseCountIsNotThree()
    {
        var student = new Student(Guid.NewGuid(), "John Doe", new EmailAddress("john@school.com"), "hashed");
        var courses = new[]
        {
            new Course(Guid.NewGuid(), "Course A", 3, Guid.NewGuid()),
            new Course(Guid.NewGuid(), "Course B", 3, Guid.NewGuid())
        };

        var action = () => student.ReplaceEnrollments(courses);

        action.Should().Throw<DomainException>()
            .WithMessage("Student must register exactly 3 courses.");
    }

    [Fact]
    public void ReplaceEnrollments_ShouldThrow_WhenTwoCoursesHaveSameTeacher()
    {
        var student = new Student(Guid.NewGuid(), "John Doe", new EmailAddress("john@school.com"), "hashed");
        var repeatedTeacher = Guid.NewGuid();
        var courses = new[]
        {
            new Course(Guid.NewGuid(), "Course A", 3, repeatedTeacher),
            new Course(Guid.NewGuid(), "Course B", 3, repeatedTeacher),
            new Course(Guid.NewGuid(), "Course C", 3, Guid.NewGuid())
        };

        var action = () => student.ReplaceEnrollments(courses);

        action.Should().Throw<DomainException>()
            .WithMessage("Student cannot register courses from the same teacher.");
    }
}
