using Microsoft.Extensions.DependencyInjection;
using TestInter.Application.Contracts;
using TestInter.Application.Services;

namespace TestInter.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthApplicationService, AuthApplicationService>();
        services.AddScoped<IStudentApplicationService, StudentApplicationService>();
        return services;
    }
}
