using VitalMinds.Clinic.Api.Domain.Enums;

namespace VitalMinds.Clinic.Api.Domain.Entities;

public class Shipment
{
    public Guid Id { get; set; }
    public Guid ExtractionId { get; set; }
    public Extraction Extraction { get; set; } = null!;
    public ShipmentDestination Destino { get; set; }
    public string Empresa { get; set; } = null!;
    public string NumeroGuia { get; set; } = null!;
    public DateOnly? FechaEnvio { get; set; }
    public string Estado { get; set; } = "Pendiente";
    public Dictionary<string, string>? Etiquetas { get; set; }
    public Dictionary<string, string>? Evidencias { get; set; }
}
