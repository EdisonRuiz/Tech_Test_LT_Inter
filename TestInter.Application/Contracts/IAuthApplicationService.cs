using TestInter.Application.DTOs.Auth;

namespace TestInter.Application.Contracts;

public interface IAuthApplicationService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default);
}
