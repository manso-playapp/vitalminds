namespace VitalMinds.Clinic.Api.Application.Responses;

public record ProfessionalResponse(
    Guid Id,
    string Nombre,
    string Apellido,
    string Especialidad,
    string Matricula,
    DateOnly FechaAlta,
    string Telefono,
    string Email,
    string? Direccion,
    bool Activo,
    IEnumerable<ProfessionalInstitutionResponse> Instituciones);

public record ProfessionalInstitutionResponse(
    Guid InstitutionId,
    string Nombre,
    bool Activo,
    DateOnly FechaAlta);
