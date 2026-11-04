namespace TestInter.Application.Contracts.Security;

public interface IPasswordHasher
{
    string Hash(string rawPassword);
    bool Verify(string rawPassword, string hashedPassword);
}
