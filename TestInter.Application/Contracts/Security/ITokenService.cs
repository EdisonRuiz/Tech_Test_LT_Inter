using TestInter.Domain.Entities;

namespace TestInter.Application.Contracts.Security;

public interface ITokenService
{
    (string Token, DateTimeOffset ExpiresAt) GenerateToken(Student student);
}
