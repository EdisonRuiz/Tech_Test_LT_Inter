using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using TestInter.Application;
using TestInter.Application.Contracts;
using TestInter.Application.Contracts.Logging;
using TestInter.Application.DTOs.Auth;
using TestInter.Application.DTOs.Students;
using TestInter.Domain.Repositories;
using TestInter.Infrastructure;
using TestInter.Infrastructure.Persistence;
using TestInter.Middleware;
using InfrastructureDI = TestInter.Infrastructure.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);
const string localWebCorsPolicy = "LocalWebCors";

builder.Services.AddOpenApi();
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddCors(options =>
{
    options.AddPolicy(localWebCorsPolicy, policy =>
    {
        policy
            .WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = InfrastructureDI.BuildTokenValidationParameters(builder.Configuration);
    });

builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseHttpsRedirection();
app.UseCors(localWebCorsPolicy);
app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<SchoolDataSeeder>();
    await seeder.SeedAsync();
}

var authGroup = app.MapGroup("/api/auth");
authGroup.MapPost("/login", async (LoginRequestDto request, IAuthApplicationService authService, CancellationToken cancellationToken) =>
{
    var result = await authService.LoginAsync(request, cancellationToken);
    return Results.Ok(result);
});

var apiGroup = app.MapGroup("/api").RequireAuthorization();

apiGroup.MapGet("/courses", async (ICourseRepository courseRepository, ITeacherRepository teacherRepository, CancellationToken cancellationToken) =>
{
    var courses = await courseRepository.ListAsync(cancellationToken);
    var teachers = await teacherRepository.ListAsync(cancellationToken);
    var teacherById = teachers.ToDictionary(teacher => teacher.Id);

    var response = courses.Select(course => new
    {
        course.Id,
        course.Name,
        course.Credits,
        TeacherFullName = teacherById[course.TeacherId].FullName
    });

    return Results.Ok(response);
});

var studentGroup = apiGroup.MapGroup("/students");

studentGroup.MapPost(string.Empty, async (CreateStudentRequestDto request, IStudentApplicationService service, CancellationToken cancellationToken) =>
{
    var created = await service.CreateAsync(request, cancellationToken);
    return Results.Created($"/api/students/{created.Id}", created);
});

studentGroup.MapGet(string.Empty, async (IStudentApplicationService service, CancellationToken cancellationToken) =>
{
    var students = await service.ListAsync(cancellationToken);
    return Results.Ok(students);
});

studentGroup.MapGet("/{studentId:guid}", async (Guid studentId, IStudentApplicationService service, CancellationToken cancellationToken) =>
{
    var student = await service.GetByIdAsync(studentId, cancellationToken);
    return student is null ? Results.NotFound() : Results.Ok(student);
});

studentGroup.MapPut("/{studentId:guid}", async (Guid studentId, UpdateStudentRequestDto request, IStudentApplicationService service, CancellationToken cancellationToken) =>
{
    var student = await service.UpdateAsync(studentId, request, cancellationToken);
    return student is null ? Results.NotFound() : Results.Ok(student);
});

studentGroup.MapDelete("/{studentId:guid}", async (Guid studentId, IStudentApplicationService service, CancellationToken cancellationToken) =>
{
    var deleted = await service.DeleteAsync(studentId, cancellationToken);
    return deleted ? Results.NoContent() : Results.NotFound();
});

studentGroup.MapGet("/enrollments", async (IStudentApplicationService service, CancellationToken cancellationToken) =>
{
    var summary = await service.ListEnrollmentSummariesAsync(cancellationToken);
    return Results.Ok(summary);
});

studentGroup.MapGet("/me/courses", async (ClaimsPrincipal principal, IStudentApplicationService service, CancellationToken cancellationToken) =>
{
    var studentIdClaim = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue(ClaimTypes.Name) ?? principal.FindFirstValue("sub");
    if (!Guid.TryParse(studentIdClaim, out var studentId))
    {
        return Results.Unauthorized();
    }

    var details = await service.GetMyCourseDetailsAsync(studentId, cancellationToken);
    return Results.Ok(details);
});

apiGroup.MapGet("/logs/{logId:guid}", async (Guid logId, IFileLogService fileLogService, CancellationToken cancellationToken) =>
{
    var log = await fileLogService.ReadByIdAsync(logId, cancellationToken);
    return log is null ? Results.NotFound() : Results.Ok(new { LogId = logId, Content = log });
});

app.Run();

public partial class Program;
