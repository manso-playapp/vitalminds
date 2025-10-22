namespace VitalMinds.Clinic.Api.Application.Requests;

public record CreateProfessionalRequest(
    string Nombre,
    string Apellido,
    string Especialidad,
    string Matricula,
    string Telefono,
    string Email,
    string? Direccion,
    DateOnly? FechaAlta,
    IEnumerable<Guid>? InstitucionIds);
