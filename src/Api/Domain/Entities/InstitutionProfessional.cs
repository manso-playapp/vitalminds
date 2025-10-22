namespace VitalMinds.Clinic.Api.Domain.Entities;

public class InstitutionProfessional
{
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid ProfessionalId { get; set; }
    public Professional Professional { get; set; } = null!;

    public DateOnly FechaAlta { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public bool Activo { get; set; } = true;
    public string Rol { get; set; } = "Profesional";
}
