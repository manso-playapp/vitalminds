namespace VitalMinds.Clinic.Api.Domain.Enums;

public static class Roles
{
    public const string Superadmin = "Superadmin";
    public const string InstitutionAdmin = "Institucion";
    public const string Psychologist = "Psicologo";
    public const string Physician = "Medico";
    public const string Phlebotomist = "Extraccionista";
    public const string Laboratory = "Laboratorio";
    public const string Patient = "Paciente";

    public static readonly string[] All =
    {
        Superadmin,
        InstitutionAdmin,
        Psychologist,
        Physician,
        Phlebotomist,
        Laboratory,
        Patient
    };
}
