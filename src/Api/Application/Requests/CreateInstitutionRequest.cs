namespace VitalMinds.Clinic.Api.Application.Requests;

public record CreateInstitutionRequest(
    string Nombre,
    string CUIT,
    string RazonSocial,
    string CondicionIVA,
    string Email,
    string Telefono,
    string Direccion,
    string Banco,
    string CBU,
    string AliasCBU,
    bool EsProfesionalIndependiente);
