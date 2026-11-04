namespace TestInter.Application.DTOs.Auth;

public sealed record LoginResponseDto(string AccessToken, DateTimeOffset ExpiresAt);
