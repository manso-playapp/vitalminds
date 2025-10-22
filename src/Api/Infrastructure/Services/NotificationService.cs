using VitalMinds.Clinic.Api.Domain.Entities;
using VitalMinds.Clinic.Api.Domain.Enums;

namespace VitalMinds.Clinic.Api.Infrastructure.Services;

public class NotificationService
{
    private readonly ILogger<NotificationService> _logger;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _dbContext;

    public NotificationService(
        ILogger<NotificationService> logger,
        IConfiguration configuration,
        ApplicationDbContext dbContext)
    {
        _logger = logger;
        _configuration = configuration;
        _dbContext = dbContext;
    }

    public async Task<Guid> SendAsync(Notification notification)
    {
        var whatsappStubEnabled = bool.TryParse(_configuration["WHATSAPP_STUB_ENABLED"], out var stubEnabled) && stubEnabled;

        if (notification.Canal == NotificationChannel.WhatsApp && !whatsappStubEnabled)
        {
            _logger.LogWarning("WhatsApp no habilitado, no se envía notificación a {Phone}", notification.ToPhone);
        }
        else
        {
            _logger.LogInformation("Enviando notificación {Channel} a {Recipient} con template {Template}",
                notification.Canal, notification.ToEmail ?? notification.ToPhone, notification.Template);
        }

        notification.Estado = "enviado";
        notification.SentAt = DateTimeOffset.UtcNow;

        _dbContext.Notifications.Add(notification);
        await _dbContext.SaveChangesAsync();

        return notification.Id;
    }
}
