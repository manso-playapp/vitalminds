namespace VitalMinds.Clinic.Api.Domain.Entities;

public class LabResult
{
    public Guid Id { get; set; }
    public Guid EpisodeId { get; set; }
    public Episode Episode { get; set; } = null!;
    public string PdfPath { get; set; } = null!;
    public Dictionary<string, string>? Valores { get; set; }
    public string Proveedor { get; set; } = null!;
    public bool Firmado { get; set; }
    public bool EnviadoPaciente { get; set; }
    public bool FacturadoObraSocial { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
