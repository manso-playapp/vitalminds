using System.Security.Claims;

namespace VitalMinds.Clinic.Api.Infrastructure.Services;

public class AuditService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditService(ApplicationDbContext dbContext, IHttpContextAccessor httpContextAccessor)
    {
        _dbContext = dbContext;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task LogAsync(string entity, string entityId, string action, Dictionary<string, object?>? diff = null)
    {
        var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "system";
        var ip = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();

        var log = new AuditLog
        {
            UserId = userId,
            Entidad = entity,
            EntidadId = entityId,
            Accion = action,
            Diff = diff,
            Ip = ip,
            Timestamp = DateTimeOffset.UtcNow
        };

        _dbContext.AuditLogs.Add(log);
        await _dbContext.SaveChangesAsync();
    }
}
