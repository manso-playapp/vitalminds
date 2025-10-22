namespace VitalMinds.Clinic.Api.Domain.Entities;

public class EpisodeDocument
{
    public Guid Id { get; set; }
    public Guid EpisodeId { get; set; }
    public Episode Episode { get; set; } = null!;

    public string Tipo { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public string Version { get; set; } = "1.0";
    public string PdfUrl { get; set; } = null!;
    public string? Hash { get; set; }
    public string? StorageProvider { get; set; }

    public string? SubidoPorUserId { get; set; }
    public ApplicationUser? SubidoPorUser { get; set; }
    public Guid? SubidoPorProfessionalId { get; set; }
    public Professional? SubidoPorProfessional { get; set; }
    public DateTimeOffset FechaSubida { get; set; } = DateTimeOffset.UtcNow;

    public bool Firmado { get; set; }
    public string? FirmadoPorUserId { get; set; }
    public ApplicationUser? FirmadoPorUser { get; set; }
    public Guid? FirmadoPorProfessionalId { get; set; }
    public Professional? FirmadoPorProfessional { get; set; }
    public DateTimeOffset? FechaFirma { get; set; }

    public ICollection<DocumentSignature> Firmas { get; set; } = new List<DocumentSignature>();
}
