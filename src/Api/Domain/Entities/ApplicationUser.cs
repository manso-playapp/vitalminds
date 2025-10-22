using VitalMinds.Clinic.Api.Domain.Enums;

public class ApplicationUser : IdentityUser
{
    public string Nombre { get; set; } = null!;
    public string Apellido { get; set; } = null!;
    public string Rol { get; set; } = Roles.Psychologist;
    public bool Activo { get; set; } = true;

    public Guid? InstitutionId { get; set; }
    public Institution? Institution { get; set; }

    public Guid? ProfessionalId { get; set; }
    public Professional? Professional { get; set; }
}
