namespace VitalMinds.Clinic.Api.Domain.Entities;

public class TestResult
{
    public Guid Id { get; set; }
    public Guid EpisodeId { get; set; }
    public Episode Episode { get; set; } = null!;
    public Guid TestCatalogId { get; set; }
    public TestCatalog TestCatalog { get; set; } = null!;
    public Dictionary<string, decimal>? Puntajes { get; set; }
    public string? Interpretacion { get; set; }
    public string? PdfPath { get; set; }
    public decimal? ValorConfig { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
