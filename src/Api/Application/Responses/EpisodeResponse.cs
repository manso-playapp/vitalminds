using VitalMinds.Clinic.Api.Domain.Enums;

namespace VitalMinds.Clinic.Api.Application.Responses;

public record EpisodeResponse(
    Guid Id,
    string Codigo,
    string Titulo,
    DateTimeOffset FechaAlta,
    EpisodeState Estado,
    Guid PatientId,
    Guid InstitutionId,
    Guid? ProfessionalId,
    Dictionary<string, DateTimeOffset>? FechasHitos,
    string CreatedByUserId,
    string? ResponsableId,
    string? Notas,
    DateTimeOffset? ClosedAt,
    string Urgencia);

public record EpisodeListItemResponse(
    Guid Id,
    string Codigo,
    string Titulo,
    DateTimeOffset FechaAlta,
    string Paciente,
    string Profesional,
    string Institucion,
    EpisodeState Estado,
    string Urgencia);

public record EpisodeAssignmentResponse(
    Guid Id,
    string Rol,
    Guid ProfessionalId,
    string ProfesionalNombre,
    Guid? AssignedByProfessionalId,
    string? AsignadoPorNombre,
    DateTimeOffset FechaAsignacion,
    DateTimeOffset? FechaFinalizacion,
    string? Notas);
