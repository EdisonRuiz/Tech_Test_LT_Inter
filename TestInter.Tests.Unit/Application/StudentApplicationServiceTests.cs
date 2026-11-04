using FluentAssertions;
using Moq;
using TestInter.Application.Contracts.Security;
using TestInter.Application.DTOs.Students;
using TestInter.Application.Services;
using TestInter.Domain.Entities;
using TestInter.Domain.Exceptions;
using TestInter.Domain.Repositories;

namespace TestInter.Tests.Unit.Application;

public sealed class StudentApplicationServiceTests
{
    [Fact]
    public async Task CreateAsync_ShouldCreateStudent_WhenRequestIsValid()
    {
        var studentRepository = new Mock<IStudentRepository>();
        var courseRepository = new Mock<ICourseRepository>();
        var teacherRepository = new Mock<ITeacherRepository>();
        var passwordHasher = new Mock<IPasswordHasher>();

        var request = new CreateStudentRequestDto(
            "John Doe",
            "john@school.com",
            "Pass123!",
            [
                Guid.Parse("20000000-0000-0000-0000-000000000001"),
                Guid.Parse("20000000-0000-0000-0000-000000000003"),
                Guid.Parse("20000000-0000-0000-0000-000000000005")
            ]);

        var courses = new[]
        {
            new Course(request.CourseIds.ElementAt(0), "A", 3, Guid.Parse("10000000-0000-0000-0000-000000000001")),
            new Course(request.CourseIds.ElementAt(1), "B", 3, Guid.Parse("10000000-0000-0000-0000-000000000002")),
            new Course(request.CourseIds.ElementAt(2), "C", 3, Guid.Parse("10000000-0000-0000-0000-000000000003"))
        };

        studentRepository.Setup(repository => repository.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Student?)null);
        courseRepository.Setup(repository => repository.GetByIdsAsync(request.CourseIds, It.IsAny<CancellationToken>()))
            .ReturnsAsync(courses);
        passwordHasher.Setup(hasher => hasher.Hash(request.Password)).Returns("hashed-password");

        var service = new StudentApplicationService(studentRepository.Object, courseRepository.Object, teacherRepository.Object, passwordHasher.Object);

        var result = await service.CreateAsync(request);

        result.Email.Should().Be(request.Email);
        result.FullName.Should().Be(request.FullName);
        studentRepository.Verify(repository => repository.AddAsync(It.IsAny<Student>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_ShouldThrow_WhenSelectedCoursesDoNotExist()
    {
        var studentRepository = new Mock<IStudentRepository>();
        var courseRepository = new Mock<ICourseRepository>();
        var teacherRepository = new Mock<ITeacherRepository>();
        var passwordHasher = new Mock<IPasswordHasher>();

        var request = new CreateStudentRequestDto(
            "John Doe",
            "john@school.com",
            "Pass123!",
            [Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()]);

        studentRepository.Setup(repository => repository.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Student?)null);
        courseRepository.Setup(repository => repository.GetByIdsAsync(request.CourseIds, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<Course>());

        var service = new StudentApplicationService(studentRepository.Object, courseRepository.Object, teacherRepository.Object, passwordHasher.Object);

        var action = () => service.CreateAsync(request);

        await action.Should().ThrowAsync<DomainException>()
            .WithMessage("One or more selected courses do not exist.");
    }
}
