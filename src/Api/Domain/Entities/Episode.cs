using VitalMinds.Clinic.Api.Domain.Enums;

namespace VitalMinds.Clinic.Api.Domain.Entities;

public class Episode
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public Patient Patient { get; set; } = null!;
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;
    public string Codigo { get; set; } = null!;
    public string Titulo { get; set; } = null!;
    public DateTimeOffset FechaAlta { get; set; } = DateTimeOffset.UtcNow;
    public EpisodeState Estado { get; set; } = EpisodeState.CREADO;
    public Dictionary<string, DateTimeOffset>? FechasHitos { get; set; }
    public string CreatedByUserId { get; set; } = null!;
    public ApplicationUser CreatedByUser { get; set; } = null!;
    public string? ResponsableId { get; set; }
    public ApplicationUser? Responsable { get; set; }
    public Guid? ProfessionalId { get; set; }
    public Professional? Professional { get; set; }
    public string Urgencia { get; set; } = "verde";
    public string? Notas { get; set; }
    public DateTimeOffset? ClosedAt { get; set; }

    public ICollection<TestResult> TestResults { get; set; } = new List<TestResult>();
    public MedicalOrder? MedicalOrder { get; set; }
    public Extraction? Extraction { get; set; }
    public ICollection<LabResult> LabResults { get; set; } = new List<LabResult>();
    public ICollection<IntegratedReport> IntegratedReports { get; set; } = new List<IntegratedReport>();
    public ICollection<TherapyProposal> TherapyProposals { get; set; } = new List<TherapyProposal>();
    public ICollection<FinanceLedger> FinanceLedgers { get; set; } = new List<FinanceLedger>();
    public ICollection<EpisodeDocument> Documents { get; set; } = new List<EpisodeDocument>();
    public ICollection<EpisodeAssignment> Assignments { get; set; } = new List<EpisodeAssignment>();
}
