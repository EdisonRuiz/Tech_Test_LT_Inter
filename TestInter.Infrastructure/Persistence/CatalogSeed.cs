using TestInter.Domain.Entities;

namespace TestInter.Infrastructure.Persistence;

public static class CatalogSeed
{
    public static readonly Guid Teacher1Id = Guid.Parse("10000000-0000-0000-0000-000000000001");
    public static readonly Guid Teacher2Id = Guid.Parse("10000000-0000-0000-0000-000000000002");
    public static readonly Guid Teacher3Id = Guid.Parse("10000000-0000-0000-0000-000000000003");
    public static readonly Guid Teacher4Id = Guid.Parse("10000000-0000-0000-0000-000000000004");
    public static readonly Guid Teacher5Id = Guid.Parse("10000000-0000-0000-0000-000000000005");

    public static readonly IReadOnlyCollection<Teacher> Teachers =
    [
        new Teacher(Teacher1Id, "Alice Johnson"),
        new Teacher(Teacher2Id, "Bob Smith"),
        new Teacher(Teacher3Id, "Carol White"),
        new Teacher(Teacher4Id, "David Brown"),
        new Teacher(Teacher5Id, "Eve Miller")
    ];

    public static readonly IReadOnlyCollection<Course> Courses =
    [
        new Course(Guid.Parse("20000000-0000-0000-0000-000000000001"), "Mathematics I", 3, Teacher1Id),
        new Course(Guid.Parse("20000000-0000-0000-0000-000000000002"), "Physics I", 3, Teacher1Id),
        new Course(Guid.Parse("20000000-0000-0000-0000-000000000003"), "Chemistry", 3, Teacher2Id),
        new Course(Guid.Parse("20000000-0000-0000-0000-000000000004"), "Biology", 3, Teacher2Id),
        new Course(Guid.Parse("20000000-0000-0000-0000-000000000005"), "Literature", 3, Teacher3Id),
        new Course(Guid.Parse("20000000-0000-0000-0000-000000000006"), "History", 3, Teacher3Id),
        new Course(Guid.Parse("20000000-0000-0000-0000-000000000007"), "Programming", 3, Teacher4Id),
        new Course(Guid.Parse("20000000-0000-0000-0000-000000000008"), "Databases", 3, Teacher4Id),
        new Course(Guid.Parse("20000000-0000-0000-0000-000000000009"), "Philosophy", 3, Teacher5Id),
        new Course(Guid.Parse("20000000-0000-0000-0000-000000000010"), "Economics", 3, Teacher5Id)
    ];
}
