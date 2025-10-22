namespace VitalMinds.Clinic.Api.Application.Requests;

public record CreateEpisodeRequest(
    Guid PatientId,
    Guid InstitutionId,
    Guid ProfessionalId,
    string Titulo,
    string? Notas);
