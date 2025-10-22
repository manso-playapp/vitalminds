using VitalMinds.Clinic.Api.Domain.Enums;

namespace VitalMinds.Clinic.Api.Domain.Entities;

public class TherapyProposal
{
    public Guid Id { get; set; }
    public Guid EpisodeId { get; set; }
    public Episode Episode { get; set; } = null!;
    public TherapyType Tipo { get; set; }
    public string Detalles { get; set; } = null!;
    public decimal? ValorConfig { get; set; }
    public bool Aceptada { get; set; }
    public DateOnly? Fecha { get; set; }
    public List<ProposalDeliveryLog> Enviados { get; set; } = new();
}

public class ProposalDeliveryLog
{
    public NotificationChannel Canal { get; set; }
    public DateTimeOffset Fecha { get; set; } = DateTimeOffset.UtcNow;
    public string Estado { get; set; } = "pendiente";
    public string? IntentoId { get; set; }
}
