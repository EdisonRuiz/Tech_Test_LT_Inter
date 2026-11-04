using Microsoft.EntityFrameworkCore;
using TestInter.Domain.Entities;

namespace TestInter.Infrastructure.Persistence;

public sealed class SchoolDbContext : DbContext
{
    public SchoolDbContext(DbContextOptions<SchoolDbContext> options) : base(options)
    {
    }

    public DbSet<Student> Students => Set<Student>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Teacher> Teachers => Set<Teacher>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Student>(entity =>
        {
            entity.ToTable("Students");
            entity.HasKey(student => student.Id);
            entity.Property(student => student.FullName).HasMaxLength(200).IsRequired();
            entity.Property(student => student.PasswordHash).HasMaxLength(500).IsRequired();
            entity.OwnsOne(student => student.Email, owned =>
            {
                owned.Property(email => email.Value)
                    .HasColumnName("Email")
                    .HasMaxLength(200)
                    .IsRequired();
                owned.HasIndex(email => email.Value).IsUnique();
            });
            entity.HasMany(student => student.Enrollments)
                .WithOne()
                .HasForeignKey(enrollment => enrollment.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Navigation(student => student.Enrollments)
                .UsePropertyAccessMode(PropertyAccessMode.Field);
        });

        modelBuilder.Entity<Course>(entity =>
        {
            entity.ToTable("Courses");
            entity.HasKey(course => course.Id);
            entity.Property(course => course.Name).HasMaxLength(200).IsRequired();
            entity.Property(course => course.Credits).IsRequired();
            entity.Property(course => course.TeacherId).IsRequired();
        });

        modelBuilder.Entity<Teacher>(entity =>
        {
            entity.ToTable("Teachers");
            entity.HasKey(teacher => teacher.Id);
            entity.Property(teacher => teacher.FullName).HasMaxLength(200).IsRequired();
        });

        modelBuilder.Entity<Enrollment>(entity =>
        {
            entity.ToTable("Enrollments");
            entity.HasKey(enrollment => enrollment.Id);
            entity.Property(enrollment => enrollment.RegisteredAt).IsRequired();
            entity.Property(enrollment => enrollment.StudentId).IsRequired();
            entity.Property(enrollment => enrollment.CourseId).IsRequired();
        });

        modelBuilder.Entity<Teacher>().HasData(CatalogSeed.Teachers);
        modelBuilder.Entity<Course>().HasData(CatalogSeed.Courses);
    }
}
