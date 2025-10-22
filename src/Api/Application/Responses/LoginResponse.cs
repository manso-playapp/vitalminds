namespace VitalMinds.Clinic.Api.Application.Responses;

public record LoginResponse(string Token, DateTime ExpiresAt, IEnumerable<string> Roles, Guid? InstitutionId);
