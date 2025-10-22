using VitalMinds.Clinic.Api.Domain.Enums;

namespace VitalMinds.Clinic.Api.Domain.Entities;

public class Notification
{
    public Guid Id { get; set; }
    public Guid? EpisodeId { get; set; }
    public Episode? Episode { get; set; }
    public string? ToUserId { get; set; }
    public ApplicationUser? ToUser { get; set; }
    public string? ToEmail { get; set; }
    public string? ToPhone { get; set; }
    public NotificationChannel Canal { get; set; }
    public string Template { get; set; } = null!;
    public Dictionary<string, object>? Payload { get; set; }
    public string Estado { get; set; } = "pendiente";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? SentAt { get; set; }
}
