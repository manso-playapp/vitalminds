namespace VitalMinds.Clinic.Api.Domain.Entities;

public class Patient
{
    public Guid Id { get; set; }
    public string DNI { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public string Apellido { get; set; } = null!;
    public DateOnly FechaNacimiento { get; set; }
    public string Telefono { get; set; } = null!;
    public string? Email { get; set; }
    public string? Prepaga { get; set; }
    public string? NumeroAfiliado { get; set; }
    public bool Consentimiento { get; set; }
    public string? Direccion { get; set; }
    public string? ContactoAlternativo { get; set; }
    public string CreatedByUserId { get; set; } = null!;
    public ApplicationUser? CreatedByUser { get; set; }

    public ICollection<Episode> Episodes { get; set; } = new List<Episode>();
}
