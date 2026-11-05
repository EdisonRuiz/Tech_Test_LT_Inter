using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace TestInter.Infrastructure.Persistence;

public sealed class SchoolDbContextFactory : IDesignTimeDbContextFactory<SchoolDbContext>
{
    public SchoolDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__SqlServer")
            ?? throw new InvalidOperationException("Connection string 'ConnectionStrings__SqlServer' not found.");

        var optionsBuilder = new DbContextOptionsBuilder<SchoolDbContext>();
        optionsBuilder.UseSqlServer(connectionString);

        return new SchoolDbContext(optionsBuilder.Options);
    }
}
