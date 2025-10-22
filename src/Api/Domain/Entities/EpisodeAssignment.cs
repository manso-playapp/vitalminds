namespace VitalMinds.Clinic.Api.Domain.Entities;

public class EpisodeAssignment
{
    public Guid Id { get; set; }
    public Guid EpisodeId { get; set; }
    public Episode Episode { get; set; } = null!;

    public Guid ProfessionalId { get; set; }
    public Professional Professional { get; set; } = null!;

    public Guid? AssignedByProfessionalId { get; set; }
    public Professional? AssignedByProfessional { get; set; }

    public string Rol { get; set; } = null!;
    public DateTimeOffset FechaAsignacion { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? FechaFinalizacion { get; set; }
    public string? Notas { get; set; }
}
