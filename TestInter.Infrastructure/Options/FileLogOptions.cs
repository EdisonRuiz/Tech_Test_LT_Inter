namespace TestInter.Infrastructure.Options;

public sealed class FileLogOptions
{
    public const string SectionName = "FileLogs";

    public string BasePath { get; set; } = "Logs";
}
