namespace VitalMinds.Clinic.Api.Domain.Entities;

public class AuditLog
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = null!;
    public ApplicationUser? User { get; set; }
    public string Entidad { get; set; } = null!;
    public string EntidadId { get; set; } = null!;
    public string Accion { get; set; } = null!;
    public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;
    public Dictionary<string, object?>? Diff { get; set; }
    public string? Ip { get; set; }
}
