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
        new Teacher(Teacher1Id, "Mauricio Otalora"),
        new Teacher(Teacher2Id, "Laureano Quintero"),
        new Teacher(Teacher3Id, "Yeison Bermudez"),
        new Teacher(Teacher4Id, "John Oswaldo"),
        new Teacher(Teacher5Id, "Miguel Castilla")
    ];

    public static readonly IReadOnlyCollection<Course> Courses =
    [
        new Course(Guid.Parse("20000000-0000-0000-0000-000000000001"), "Matematicas I", 3, Teacher1Id),
        new Course(Guid.Parse("20000000-0000-0000-0000-000000000002"), "Fisica I", 3, Teacher1Id),
        new Course(Guid.Parse("20000000-0000-0000-0000-000000000003"), "Quimica", 3, Teacher2Id),
        new Course(Guid.Parse("20000000-0000-0000-0000-000000000004"), "Biologia", 3, Teacher2Id),
        new Course(Guid.Parse("20000000-0000-0000-0000-000000000005"), "Literatura", 3, Teacher3Id),
        new Course(Guid.Parse("20000000-0000-0000-0000-000000000006"), "Historia", 3, Teacher3Id),
        new Course(Guid.Parse("20000000-0000-0000-0000-000000000007"), "Programacion", 3, Teacher4Id),
        new Course(Guid.Parse("20000000-0000-0000-0000-000000000008"), "Bases de Datos", 3, Teacher4Id),
        new Course(Guid.Parse("20000000-0000-0000-0000-000000000009"), "Filosofia", 3, Teacher5Id),
        new Course(Guid.Parse("20000000-0000-0000-0000-000000000010"), "Economia", 3, Teacher5Id)
    ];
}
