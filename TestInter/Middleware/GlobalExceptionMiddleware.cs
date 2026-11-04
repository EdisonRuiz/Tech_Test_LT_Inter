using Microsoft.AspNetCore.Mvc;
using TestInter.Application.Contracts.Logging;
using TestInter.Domain.Exceptions;

namespace TestInter.Middleware;

public sealed class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;

    public GlobalExceptionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IFileLogService fileLogService)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            var logId = Guid.NewGuid();
            await fileLogService.WriteErrorAsync(logId, exception, context.RequestAborted);

            var (statusCode, title) = exception switch
            {
                DomainException => (StatusCodes.Status400BadRequest, "Domain rule violation"),
                BadHttpRequestException => (StatusCodes.Status400BadRequest, "Bad request"),
                KeyNotFoundException => (StatusCodes.Status404NotFound, "Resource not found"),
                UnauthorizedAccessException => (StatusCodes.Status403Forbidden, "Forbidden"),
                _ => (StatusCodes.Status500InternalServerError, "Internal server error")
            };

            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/problem+json";

            var details = new ProblemDetails
            {
                Title = title,
                Status = statusCode,
                Detail = exception switch
                {
                    DomainException => exception.Message,
                    BadHttpRequestException => "Request payload is invalid.",
                    _ => "An error occurred while processing the request."
                },
                Instance = context.Request.Path
            };
            details.Extensions["logId"] = logId;

            await context.Response.WriteAsJsonAsync(details, context.RequestAborted);
        }
    }
}
