using VitalMinds.Clinic.Api.Domain.Enums;

namespace VitalMinds.Clinic.Api.Domain.Entities;

public class Sample
{
    public Guid Id { get; set; }
    public Guid ExtractionId { get; set; }
    public Extraction Extraction { get; set; } = null!;
    public string Tipo { get; set; } = null!;
    public SampleClassification Clasificacion { get; set; }
    public string? Rotulo { get; set; }
    public decimal? Temperatura { get; set; }
    public Dictionary<string, bool>? Checklist { get; set; }
}
