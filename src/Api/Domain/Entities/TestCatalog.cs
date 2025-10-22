namespace VitalMinds.Clinic.Api.Domain.Entities;

public class TestCatalog
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string Version { get; set; } = null!;
    public string? Descripcion { get; set; }

    public ICollection<TestResult> TestResults { get; set; } = new List<TestResult>();
}
