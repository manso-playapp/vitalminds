namespace VitalMinds.Clinic.Api.Domain.Entities;

public class Extraction
{
    public Guid Id { get; set; }
    public Guid EpisodeId { get; set; }
    public Episode Episode { get; set; } = null!;
    public string ExtraccionistaUserId { get; set; } = null!;
    public ApplicationUser Extraccionista { get; set; } = null!;
    public DateOnly Fecha { get; set; }
    public string Franja { get; set; } = null!;
    public string Estado { get; set; } = "Programada";
    public Dictionary<string, string>? Evidencias { get; set; }

    public ICollection<Sample> Samples { get; set; } = new List<Sample>();
    public ICollection<Shipment> Shipments { get; set; } = new List<Shipment>();
}
