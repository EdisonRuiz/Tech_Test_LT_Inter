using TestInter.Application.Contracts;
using TestInter.Application.Contracts.Security;
using TestInter.Application.DTOs.Auth;
using TestInter.Domain.Exceptions;
using TestInter.Domain.Repositories;

namespace TestInter.Application.Services;

public sealed class AuthApplicationService : IAuthApplicationService
{
    private readonly IStudentRepository _studentRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;

    public AuthApplicationService(
        IStudentRepository studentRepository,
        IPasswordHasher passwordHasher,
        ITokenService tokenService)
    {
        _studentRepository = studentRepository;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        var student = await _studentRepository.GetByEmailAsync(request.Email, cancellationToken);
        if (student is null || !_passwordHasher.Verify(request.Password, student.PasswordHash))
        {
            throw new DomainException("Invalid credentials.");
        }

        var token = _tokenService.GenerateToken(student);
        return new LoginResponseDto(token.Token, token.ExpiresAt);
    }
}
