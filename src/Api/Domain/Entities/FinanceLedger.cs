namespace VitalMinds.Clinic.Api.Domain.Entities;

public class FinanceLedger
{
    public Guid Id { get; set; }
    public Guid EpisodeId { get; set; }
    public Episode Episode { get; set; } = null!;
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;
    public string Fase { get; set; } = null!;
    public string Codigo { get; set; } = null!;
    public decimal Valor { get; set; }
    public DateOnly Fecha { get; set; }
}
