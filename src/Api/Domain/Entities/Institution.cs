namespace VitalMinds.Clinic.Api.Domain.Entities;

public class Institution
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string CUIT { get; set; } = null!;
    public string RazonSocial { get; set; } = null!;
    public string CondicionIVA { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Telefono { get; set; } = null!;
    public string Direccion { get; set; } = null!;
    public string Banco { get; set; } = null!;
    public string CBU { get; set; } = null!;
    public string AliasCBU { get; set; } = null!;
    public bool EsProfesionalIndependiente { get; set; }
    public bool Activa { get; set; } = true;

    public Parameters? Parameters { get; set; }
    public ICollection<ApplicationUser> Users { get; set; } = new List<ApplicationUser>();
    public ICollection<InstitutionProfessional> Profesionales { get; set; } = new List<InstitutionProfessional>();
    public ICollection<Episode> Episodes { get; set; } = new List<Episode>();
    public ICollection<Patient> Patients { get; set; } = new List<Patient>();
}
