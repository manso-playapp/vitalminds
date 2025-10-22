using VitalMinds.Clinic.Api.Domain.Enums;

namespace VitalMinds.Clinic.Api.Application.Requests;

public record AddTestResultRequest(
    Guid TestCatalogId,
    Dictionary<string, decimal> Puntajes,
    string? Interpretacion,
    bool GenerarPdf);

public record DeriveToDoctorRequest(string? Nota);

public record PsychOkNoDerivationRequest(Dictionary<string, bool>? ClinicalFlags);

public record MedicalOrderRequest(
    List<MedicalOrderItemRequest> Items,
    MedicalOrderDestination Destino);

public record MedicalOrderItemRequest(
    string Codigo,
    string Nombre,
    SampleClassification Complejidad,
    decimal ValorArs,
    bool RequiereAutorizacion);

public record ExtractionRequest(
    DateOnly Fecha,
    string Franja,
    string Estado,
    Dictionary<string, string>? Evidencias);

public record ExtractionStatusRequest(string Estado);

public record CreateShipmentRequest(
    ShipmentDestination Destino,
    string Empresa,
    string NumeroGuia,
    DateOnly? FechaEnvio,
    string Estado,
    Dictionary<string, string>? Etiquetas,
    Dictionary<string, string>? Evidencias);

public record LabResultRequest(
    string PdfPath,
    Dictionary<string, string>? Valores,
    string Proveedor,
    bool Firmado,
    bool EnviarAlPaciente,
    bool FacturadoObraSocial);

public record IntegratedReportRequest(
    string TipoInforme,
    string PdfPath);

public record TherapyProposalRequest(
    TherapyType Tipo,
    string Detalles,
    decimal? ValorConfig,
    bool? Aceptada,
    DateOnly? Fecha);

public record ProposalSendRequest(
    IEnumerable<string> Canales,
    string Url);

public record SurveyRequest(
    int Nps,
    Dictionary<string, int> Items,
    string? Comentario);
