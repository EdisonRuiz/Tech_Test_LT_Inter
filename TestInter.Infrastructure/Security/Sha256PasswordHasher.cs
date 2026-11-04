using System.Security.Cryptography;
using System.Text;
using TestInter.Application.Contracts.Security;

namespace TestInter.Infrastructure.Security;

public sealed class Sha256PasswordHasher : IPasswordHasher
{
    public string Hash(string rawPassword)
    {
        var input = Encoding.UTF8.GetBytes(rawPassword);
        var hashBytes = SHA256.HashData(input);
        return Convert.ToBase64String(hashBytes);
    }

    public bool Verify(string rawPassword, string hashedPassword)
    {
        var recalculated = Hash(rawPassword);
        return string.Equals(recalculated, hashedPassword, StringComparison.Ordinal);
    }
}
