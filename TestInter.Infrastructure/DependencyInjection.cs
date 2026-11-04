using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using TestInter.Application.Contracts.Logging;
using TestInter.Application.Contracts.Security;
using TestInter.Domain.Repositories;
using TestInter.Infrastructure.Logging;
using TestInter.Infrastructure.Options;
using TestInter.Infrastructure.Persistence;
using TestInter.Infrastructure.Repositories;
using TestInter.Infrastructure.Security;

namespace TestInter.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<FileLogOptions>(configuration.GetSection(FileLogOptions.SectionName));

        var connectionString = configuration.GetConnectionString("SqlServer");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("Connection string 'SqlServer' is required.");
        }

        services.AddDbContext<SchoolDbContext>(options => options.UseSqlServer(connectionString));

        services.AddScoped<IStudentRepository, StudentRepository>();
        services.AddScoped<ICourseRepository, CourseRepository>();
        services.AddScoped<ITeacherRepository, TeacherRepository>();

        services.AddSingleton<IPasswordHasher, Sha256PasswordHasher>();
        services.AddSingleton<ITokenService, JwtTokenService>();
        services.AddSingleton<IFileLogService, FileLogService>();
        services.AddScoped<SchoolDataSeeder>();

        return services;
    }

    public static TokenValidationParameters BuildTokenValidationParameters(IConfiguration configuration)
    {
        var jwtOptions = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();

        return new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SecretKey)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    }
}
