namespace VitalMinds.Clinic.Api.Domain.Entities;

public class DocumentSignature
{
    public Guid Id { get; set; }
    public Guid EpisodeDocumentId { get; set; }
    public EpisodeDocument EpisodeDocument { get; set; } = null!;

    public string Proveedor { get; set; } = "internal";
    public string Estado { get; set; } = "pending";
    public string? HashDocumento { get; set; }
    public string? Motivo { get; set; }

    public string? FirmadoPorUserId { get; set; }
    public ApplicationUser? FirmadoPorUser { get; set; }
    public Guid? FirmadoPorProfessionalId { get; set; }
    public Professional? FirmadoPorProfessional { get; set; }

    public DateTimeOffset CreadoEl { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? FirmadoEl { get; set; }
}
