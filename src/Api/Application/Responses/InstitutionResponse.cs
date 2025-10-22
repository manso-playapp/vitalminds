namespace VitalMinds.Clinic.Api.Application.Responses;

public record InstitutionResponse(
    Guid Id,
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
    bool EsProfesionalIndependiente,
    bool Activa);
