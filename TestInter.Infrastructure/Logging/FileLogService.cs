using System.Text;
using Microsoft.Extensions.Options;
using TestInter.Application.Contracts.Logging;
using TestInter.Infrastructure.Options;

namespace TestInter.Infrastructure.Logging;

public sealed class FileLogService : IFileLogService
{
    private readonly string _basePath;

    public FileLogService(IOptions<FileLogOptions> options)
    {
        _basePath = options.Value.BasePath;
    }

    public async Task WriteErrorAsync(Guid logId, Exception exception, CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(_basePath);

        var filePath = GetFilePath(logId);
        var content = new StringBuilder()
            .AppendLine($"LogId: {logId}")
            .AppendLine($"CreatedAtUtc: {DateTimeOffset.UtcNow:O}")
            .AppendLine($"Type: {exception.GetType().FullName}")
            .AppendLine($"Message: {exception.Message}")
            .AppendLine("StackTrace:")
            .AppendLine(exception.ToString())
            .ToString();

        await File.WriteAllTextAsync(filePath, content, cancellationToken);
    }

    public async Task<string?> ReadByIdAsync(Guid logId, CancellationToken cancellationToken = default)
    {
        var filePath = GetFilePath(logId);
        if (!File.Exists(filePath))
        {
            return null;
        }

        return await File.ReadAllTextAsync(filePath, cancellationToken);
    }

    private string GetFilePath(Guid logId)
    {
        return Path.Combine(_basePath, $"{logId:N}.log");
    }
}
