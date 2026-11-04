using FluentAssertions;
using Moq;
using TestInter.Application.Contracts.Security;
using TestInter.Application.DTOs.Auth;
using TestInter.Application.Services;
using TestInter.Domain.Entities;
using TestInter.Domain.Exceptions;
using TestInter.Domain.Repositories;
using TestInter.Domain.ValueObjects;

namespace TestInter.Tests.Unit.Application;

public sealed class AuthApplicationServiceTests
{
    [Fact]
    public async Task LoginAsync_ShouldReturnToken_WhenCredentialsAreValid()
    {
        var studentRepository = new Mock<IStudentRepository>();
        var passwordHasher = new Mock<IPasswordHasher>();
        var tokenService = new Mock<ITokenService>();

        var student = new Student(Guid.NewGuid(), "John Doe", new EmailAddress("john@school.com"), "hash");

        studentRepository.Setup(repository => repository.GetByEmailAsync("john@school.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(student);
        passwordHasher.Setup(hasher => hasher.Verify("Pass123!", "hash")).Returns(true);
        tokenService.Setup(service => service.GenerateToken(student))
            .Returns(("jwt-token", DateTimeOffset.UtcNow.AddHours(1)));

        var service = new AuthApplicationService(studentRepository.Object, passwordHasher.Object, tokenService.Object);

        var result = await service.LoginAsync(new LoginRequestDto("john@school.com", "Pass123!"));

        result.AccessToken.Should().Be("jwt-token");
    }

    [Fact]
    public async Task LoginAsync_ShouldThrow_WhenCredentialsAreInvalid()
    {
        var studentRepository = new Mock<IStudentRepository>();
        var passwordHasher = new Mock<IPasswordHasher>();
        var tokenService = new Mock<ITokenService>();

        studentRepository.Setup(repository => repository.GetByEmailAsync("john@school.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Student?)null);

        var service = new AuthApplicationService(studentRepository.Object, passwordHasher.Object, tokenService.Object);

        var action = () => service.LoginAsync(new LoginRequestDto("john@school.com", "wrong"));

        await action.Should().ThrowAsync<DomainException>()
            .WithMessage("Invalid credentials.");
    }
}
