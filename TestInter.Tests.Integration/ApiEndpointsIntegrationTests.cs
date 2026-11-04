using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace TestInter.Tests.Integration;

public sealed class ApiEndpointsIntegrationTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ApiEndpointsIntegrationTests(ApiWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Login_ShouldReturnToken()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = "student1@school.com",
            Password = "Pass123!"
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        using var payload = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        payload.RootElement.GetProperty("accessToken").GetString().Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task ProtectedEndpoint_ShouldReturnUnauthorized_WithoutToken()
    {
        var response = await _client.GetAsync("/api/students");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DomainException_ShouldReturnProblemDetails_AndLogShouldBeQueryable()
    {
        var token = await LoginAndGetTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var invalidResponse = await _client.PostAsJsonAsync("/api/students", new
        {
            FullName = "Invalid Student",
            Email = "invalid@school.com",
            Password = "Pass123!",
            CourseIds = new[]
            {
                "20000000-0000-0000-0000-000000000001",
                "20000000-0000-0000-0000-000000000003"
            }
        });

        invalidResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        using var invalidPayload = JsonDocument.Parse(await invalidResponse.Content.ReadAsStringAsync());
        invalidPayload.RootElement.GetProperty("title").GetString().Should().Be("Domain rule violation");

        var logId = invalidPayload.RootElement.GetProperty("logId").GetGuid();

        var logResponse = await _client.GetAsync($"/api/logs/{logId}");
        logResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        using var logPayload = JsonDocument.Parse(await logResponse.Content.ReadAsStringAsync());
        logPayload.RootElement.GetProperty("logId").GetGuid().Should().Be(logId);
        logPayload.RootElement.GetProperty("content").GetString().Should().Contain("Student must register exactly 3 courses.");
    }

    private async Task<string> LoginAndGetTokenAsync()
    {
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = "student1@school.com",
            Password = "Pass123!"
        });

        loginResponse.EnsureSuccessStatusCode();
        using var payload = JsonDocument.Parse(await loginResponse.Content.ReadAsStringAsync());
        return payload.RootElement.GetProperty("accessToken").GetString()!;
    }
}
