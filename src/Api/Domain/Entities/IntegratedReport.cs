namespace VitalMinds.Clinic.Api.Domain.Entities;

public class IntegratedReport
{
    public Guid Id { get; set; }
    public Guid EpisodeId { get; set; }
    public Episode Episode { get; set; } = null!;
    public string PdfPath { get; set; } = null!;
    public string Version { get; set; } = "1.0.0";
    public string FirmadoPorUserId { get; set; } = null!;
    public ApplicationUser FirmadoPor { get; set; } = null!;
    public string TipoInforme { get; set; } = "psico";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
