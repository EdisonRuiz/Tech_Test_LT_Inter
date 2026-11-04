namespace TestInter.Application.Contracts.Logging;

public interface IFileLogService
{
    Task WriteErrorAsync(Guid logId, Exception exception, CancellationToken cancellationToken = default);
    Task<string?> ReadByIdAsync(Guid logId, CancellationToken cancellationToken = default);
}
