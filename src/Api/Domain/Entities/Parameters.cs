namespace VitalMinds.Clinic.Api.Domain.Entities;

public class Parameters
{
    public Guid Id { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;
    public Dictionary<string, object>? TestsHabilitados { get; set; }
    public Dictionary<string, object>? CatalogoEstudios { get; set; }
    public Dictionary<string, object>? SLAs { get; set; }
    public Dictionary<string, object>? Plantillas { get; set; }
}
