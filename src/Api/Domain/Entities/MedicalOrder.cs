using VitalMinds.Clinic.Api.Domain.Enums;

namespace VitalMinds.Clinic.Api.Domain.Entities;

public class MedicalOrder
{
    public Guid Id { get; set; }
    public Guid EpisodeId { get; set; }
    public Episode Episode { get; set; } = null!;
    public List<MedicalOrderItem> Items { get; set; } = new();
    public string FirmanteUserId { get; set; } = null!;
    public ApplicationUser Firmante { get; set; } = null!;
    public string PdfPath { get; set; } = null!;
    public MedicalOrderDestination Destino { get; set; }
    public string Estado { get; set; } = "Emitido";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class MedicalOrderItem
{
    public string Codigo { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public SampleClassification Complejidad { get; set; }
    public decimal ValorArs { get; set; }
    public bool RequiereAutorizacion { get; set; }
}
