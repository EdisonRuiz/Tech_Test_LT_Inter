# Documentación Técnica - TestInter API

Documentación de la API **TestInter** (`.NET 10`), centrada en arquitectura.
<img width="1376" height="768" alt="Arquitectura" src="https://github.com/user-attachments/assets/a4a05c77-15c3-4c59-812b-40ccea931bd3" />

---

## 1. Arquitectura

El proyecto implementa **Clean Architecture (Arquitectura Limpia)** combinada con principios tácticos de **Domain-Driven Design (DDD)** sobre **.NET 10**, utilizando **Minimal APIs** y **Entity Framework Core (SQL Server)**.

### Estructura de la solución (`TestInter.slnx`)

```text
Back/
├── TestInter.Domain/              # Capa de Dominio (Entidades, Value Objects, reglas de negocio, contratos de repositorios)
├── TestInter.Application/         # Capa de Aplicación (casos de uso, DTOs, contratos de servicios)
├── TestInter.Infrastructure/      # Capa de Infraestructura (EF Core, repositorios, JWT, hashing, logs en archivo)
├── TestInter/                     # Capa de Presentación / API (Minimal APIs, middlewares, DI, configuración)
├── TestInter.Tests.Unit/          # Pruebas unitarias (dominio y aplicación)
└── TestInter.Tests.Integration/   # Pruebas de integración (endpoints HTTP con WebApplicationFactory)
```

### Detalle por capas

#### `TestInter.Domain` (núcleo)

- Sin dependencias externas.
- **Entidades:**
  - `Student`: raíz de agregado que gestiona su información personal y su colección encapsulada de inscripciones (`Enrollments`).
  - `Course`: materia con créditos (`Credits > 0`) e identificador de profesor (`TeacherId`).
  - `Teacher`: docente asignado a los cursos.
  - `Enrollment`: vincula un estudiante con un curso y la fecha de registro (`RegisteredAt`).
- **Value Objects:**
  - `EmailAddress`: valida que el correo no esté vacío y contenga `@`, normaliza el valor (`Trim().ToLowerInvariant()`) y garantiza igualdad por valor.
- **Reglas de negocio invariantes:**
  - Un estudiante debe inscribir **exactamente 3 cursos** (`ReplaceEnrollments`).
  - Un estudiante **no puede inscribir cursos duplicados**.
  - Un estudiante **no puede inscribir más de un curso con el mismo profesor**.
- **Excepciones:** `DomainException` para violaciones de reglas de negocio.
- **Interfaces de repositorios:** `IStudentRepository`, `ICourseRepository`, `ITeacherRepository`.

#### `TestInter.Application` (orquestación / casos de uso)

- Depende únicamente de `TestInter.Domain`.
- **Servicios de aplicación:**
  - `AuthApplicationService` (`IAuthApplicationService`): valida credenciales y coordina la generación de tokens JWT.
  - `StudentApplicationService` (`IStudentApplicationService`): gestiona el CRUD de estudiantes, asignación de materias, consulta de compañeros de clase y enmascaramiento de emails.
- **Contratos transversales:** `IPasswordHasher`, `ITokenService`, `IFileLogService`.
- **DTOs:** objetos inmutables (`sealed record`) para solicitudes y respuestas.

#### `TestInter.Infrastructure` (detalles técnicos y persistencia)

- Implementa las interfaces definidas en `Domain` y `Application`.
- **Persistencia (`SchoolDbContext`):**
  - Mapeo con **EF Core** sobre **SQL Server** (`LocalDB` por defecto).
  - Índice único sobre el correo electrónico del estudiante (`Students.Email`) y borrado en cascada sobre `Enrollments`.
  - **Semilla de datos (`CatalogSeed` y `SchoolDataSeeder`):** precarga 5 profesores, 10 cursos (3 créditos cada uno, 2 cursos por profesor) y un estudiante inicial (`student1@school.com` / `Pass123!`).
- **Logging (`FileLogService`):** escritura y lectura de archivos `.log` en disco (carpeta `Logs/`) identificados por un `Guid`.
- **Seguridad:** implementaciones `JwtTokenService` y `Sha256PasswordHasher`.

#### `TestInter` (presentación / host Web API)

- **Minimal APIs (`Program.cs`):** definición de grupos de rutas (`/api/auth`, `/api`, `/api/students`), inyección de dependencias y ejecución del seeder al inicio.
- **Manejo global de excepciones (`GlobalExceptionMiddleware`):** intercepta excepciones no controladas, escribe el detalle técnico en disco mediante `IFileLogService` y devuelve una respuesta estandarizada **RFC 7807 (`ProblemDetails` - `application/problem+json`)** incluyendo el `logId`:
  - `DomainException` → `400 Bad Request`
  - `BadHttpRequestException` → `400 Bad Request`
  - `KeyNotFoundException` → `404 Not Found`
  - `UnauthorizedAccessException` → `403 Forbidden`
  - Otras excepciones → `500 Internal Server Error`

---

## 2. Endpoints expuestos

En entorno de desarrollo (`Development`), el esquema OpenAPI se expone en `/openapi/v1.json`.

### Resumen de endpoints

| Método | Ruta | Autenticación | Descripción |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/login` | Público | Autentica un estudiante y retorna un JWT |
| `GET` | `/api/courses` | JWT requerido | Lista el catálogo de cursos con su profesor |
| `POST` | `/api/students` | JWT requerido | Registra un nuevo estudiante |
| `GET` | `/api/students` | JWT requerido | Lista todos los estudiantes (con email enmascarado) |
| `GET` | `/api/students/{studentId:guid}` | JWT requerido | Obtiene un estudiante por su ID |
| `PUT` | `/api/students/{studentId:guid}` | JWT requerido | Actualiza el nombre e inscribe los 3 cursos del estudiante |
| `DELETE` | `/api/students/{studentId:guid}` | JWT requerido | Elimina un estudiante y sus inscripciones |
| `GET` | `/api/students/enrollments` | JWT requerido | Lista el resumen de inscripciones de todos los estudiantes |
| `GET` | `/api/students/me/courses` | Claims de token requeridos | Obtiene los cursos del estudiante autenticado y sus compañeros |
| `GET` | `/api/logs/{logId:guid}` | JWT requerido | Consulta el contenido de un log de error por su `logId` |

---

### Detalle de endpoints

#### 2.1. Autenticación

##### `POST /api/auth/login`

Valida las credenciales del estudiante y genera un token de acceso JWT.

- **Request body (`LoginRequestDto`):**

```json
{
  "email": "student1@school.com",
  "password": "Pass123!"
}
```

- **Responses:**
  - `200 OK` (`LoginResponseDto`):

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresAt": "2026-11-03T22:05:00Z"
}
```

  - `400 Bad Request`: credenciales inválidas (`DomainException: "Invalid credentials."`).

---

#### 2.2. Catálogo de cursos

##### `GET /api/courses`

Retorna todos los cursos disponibles junto con el nombre completo del profesor que los imparte.

- **Headers:** `Authorization: Bearer <token>`
- **Responses:**
  - `200 OK`:

```json
[
  {
	"id": "20000000-0000-0000-0000-000000000001",
	"name": "Matematicas I",
	"credits": 3,
	"teacherFullName": "Mauricio Otalora"
  }
]
```

  - `401 Unauthorized`: si no se envía un token válido.

---

#### 2.3. Gestión de estudiantes e inscripciones (`/api/students`)

##### `POST /api/students`

Crea un nuevo estudiante en el sistema.

- **Request body (`CreateStudentRequestDto`):**

```json
{
  "fullName": "Juan Perez",
  "email": "juan@school.com",
  "password": "Password123!"
}
```

- **Responses:**
  - `201 Created` (`StudentDto`):

```json
{
  "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "fullName": "Juan Perez",
  "email": "juan@school.com"
}
```

  - `400 Bad Request`: si el correo ya está registrado o tiene un formato inválido.

##### `GET /api/students`

Obtiene el listado de todos los estudiantes registrados. Por privacidad, el campo `email` se devuelve enmascarado.

- **Responses:**
  - `200 OK` (`StudentDto[]`):

```json
[
  {
	"id": "30000000-0000-0000-0000-000000000001",
	"fullName": "Edison Ruiz",
	"email": "stu****************"
  }
]
```

##### `GET /api/students/{studentId:guid}`

Obtiene el detalle de un estudiante específico por su `Guid` (retorna el email sin enmascarar).

- **Responses:**
  - `200 OK` (`StudentDto`)
  - `404 Not Found`: si el estudiante no existe.

##### `PUT /api/students/{studentId:guid}`

Actualiza el nombre del estudiante y reemplaza sus materias inscritas.

- **Request body (`UpdateStudentRequestDto`):**

```json
{
  "fullName": "Edison Ruiz",
  "courseIds": [
	"20000000-0000-0000-0000-000000000001",
	"20000000-0000-0000-0000-000000000003",
	"20000000-0000-0000-0000-000000000005"
  ]
}
```

- **Responses:**
  - `200 OK` (`StudentDto`)
  - `400 Bad Request`: si algún curso no existe, no son exactamente 3 cursos, hay cursos repetidos o dos cursos pertenecen al mismo profesor.
  - `404 Not Found`: si el estudiante no existe.

##### `DELETE /api/students/{studentId:guid}`

Elimina un estudiante y sus inscripciones asociadas.

- **Responses:**
  - `204 No Content`: eliminación exitosa.
  - `404 Not Found`: si el estudiante no existe.

##### `GET /api/students/enrollments`

Lista todos los estudiantes junto con el resumen de los cursos que tienen inscritos y el profesor de cada curso.

- **Responses:**
  - `200 OK` (`StudentEnrollmentSummaryDto[]`):

```json
[
  {
	"studentId": "30000000-0000-0000-0000-000000000001",
	"studentFullName": "Edison Ruiz",
	"courses": [
	  {
		"courseId": "20000000-0000-0000-0000-000000000001",
		"courseName": "Matematicas I",
		"teacherFullName": "Mauricio Otalora"
	  }
	]
  }
]
```

##### `GET /api/students/me/courses`

Obtiene las materias inscritas por el estudiante autenticado (extraído de los claims `NameIdentifier`, `Name` o `sub` del JWT) e incluye la lista de nombres de los compañeros inscritos en cada materia.

- **Headers:** `Authorization: Bearer <token>`
- **Responses:**
  - `200 OK` (`MyCourseDetailsDto[]`):

```json
[
  {
	"courseId": "20000000-0000-0000-0000-000000000001",
	"courseName": "Matematicas I",
	"teacherFullName": "Mauricio Otalora",
	"classmatesFullNames": [
	  "Maria Gomez",
	  "Carlos Lopez"
	]
  }
]
```

  - `401 Unauthorized`: si el usuario no envía un token con un `Guid` válido en el claim de identidad.

---

#### 2.4. Consulta de logs

##### `GET /api/logs/{logId:guid}`

Permite recuperar la traza completa de un error registrado en archivo a partir del `logId` retornado en el `ProblemDetails`.

- **Headers:** `Authorization: Bearer <token>`
- **Responses:**
  - `200 OK`:

```json
{
  "logId": "05c15d0f-1015-486c-a268-adcd62828d29",
  "content": "LogId: 05c15d0f-1015-486c-a268-adcd62828d29\r\nCreatedAtUtc: ...\r\nType: ...\r\nMessage: ...\r\nStackTrace:..."
}
```

  - `401 Unauthorized`: si no se envía un token válido.
  - `404 Not Found`: si el archivo de log no existe.

---

## 3. Seguridad

### 3.1. Autenticación y emisión de tokens (JWT)

- **Esquema:** `JwtBearer` (`Microsoft.AspNetCore.Authentication.JwtBearer`).
- **Algoritmo de firma:** `HMAC-SHA256` (`SecurityAlgorithms.HmacSha256`) con clave simétrica configurada en `Jwt:SecretKey`.
- **Parámetros de validación (`DependencyInjection.BuildTokenValidationParameters`):**
  - `ValidateIssuer = true` (`TestInter.Api`)
  - `ValidateAudience = true` (`TestInter.Client`)
  - `ValidateIssuerSigningKey = true`
  - `ValidateLifetime = true` (expiración configurada en **5 minutos** en `appsettings.json`, con un `ClockSkew` de **1 minuto**).
- **Claims incluidos en el token (`JwtTokenService`):**
  - `sub`: ID del estudiante (`Guid`).
  - `email`: correo electrónico del estudiante.
  - `name`: nombre completo del estudiante.
  - `sid` (condicional): si el email del estudiante coincide con `Jwt:RoleUser` (`student1@school.com`), se inyecta el claim `sid` con el valor de `Jwt:RoleAdmin` (`Admin`).

### 3.2. Autorización en rutas

- El grupo raíz `/api` exige autenticación por defecto mediante `.RequireAuthorization()`, protegiendo directamente:
  - `GET /api/courses`
  - `GET /api/logs/{logId:guid}`
- El subgrupo `/api/students` aplica `.AllowAnonymous()`, dejando públicos los endpoints de gestión de estudiantes, con la excepción funcional de `GET /api/students/me/courses`, el cual inspecciona el `ClaimsPrincipal` y retorna `401 Unauthorized` si el token no está presente o no contiene un identificador de estudiante válido.

### 3.3. Hashing de contraseñas

- Implementado en `Sha256PasswordHasher` (`IPasswordHasher`).
- Las contraseñas nunca se almacenan en texto plano; se les aplica `SHA256.HashData` sobre los bytes UTF-8 y se almacenan codificadas en `Base64`.
- La verificación compara el hash recalculado mediante comparación ordinal exacta (`StringComparison.Ordinal`).

### 3.4. Protección y privacidad de datos

- **Enmascaramiento de correos (`StudentApplicationService.MaskEmail`):** al listar estudiantes (`GET /api/students`), se ocultan los correos electrónicos dejando visibles únicamente los primeros 3 caracteres y reemplazando el resto por asteriscos (`*`).
- **No exposición de hashes:** la entidad `Student` mantiene `PasswordHash` en el dominio y en persistencia, pero los DTOs de salida (`StudentDto`) solo exponen `Id`, `FullName` y `Email`.
- **Ocultamiento de detalles internos en errores:** `GlobalExceptionMiddleware` evita filtrar trazas de pila o detalles de excepciones de infraestructura al cliente en errores `500`, devolviendo un mensaje genérico (`"An error occurred while processing the request."`) junto con un `logId` de correlación.

### 3.5. Seguridad de transporte y CORS

- **HTTPS redirection:** habilitado en el pipeline mediante `app.UseHttpsRedirection()`.
- **Política CORS (`LocalWebCors`):** restringe los orígenes permitidos exclusivamente al frontend local en `http://localhost:4200` (permitiendo cualquier método y cabecera desde dicho origen).
