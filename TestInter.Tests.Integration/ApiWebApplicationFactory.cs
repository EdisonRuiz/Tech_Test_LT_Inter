using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace TestInter.Tests.Integration;

public sealed class ApiWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment(Environments.Development);

        builder.ConfigureAppConfiguration((_, configBuilder) =>
        {
            configBuilder.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Database:Provider"] = "InMemory",
                ["ConnectionStrings:InMemory"] = $"TestInterDb-{Guid.NewGuid():N}",
                ["FileLogs:BasePath"] = Path.Combine(Path.GetTempPath(), $"testinter-logs-{Guid.NewGuid():N}")
            });
        });
    }
}
