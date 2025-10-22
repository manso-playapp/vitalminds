namespace VitalMinds.Clinic.Api.Domain.Entities;

public class Professional
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string Apellido { get; set; } = null!;
    public string Especialidad { get; set; } = null!;
    public string Matricula { get; set; } = null!;
    public DateOnly FechaAlta { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public string Telefono { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Direccion { get; set; }
    public bool Activo { get; set; } = true;

    public string? UserId { get; set; }
    public ApplicationUser? User { get; set; }

    public ICollection<InstitutionProfessional> Instituciones { get; set; } = new List<InstitutionProfessional>();
    public ICollection<Episode> EpisodiosResponsables { get; set; } = new List<Episode>();
    public ICollection<EpisodeAssignment> AsignacionesRecibidas { get; set; } = new List<EpisodeAssignment>();
    public ICollection<EpisodeAssignment> AsignacionesDerivadas { get; set; } = new List<EpisodeAssignment>();
}
