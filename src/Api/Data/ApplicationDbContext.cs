using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Text.Json;
using VitalMinds.Clinic.Api.Domain.Enums;

namespace VitalMinds.Clinic.Api.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole, string>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Institution> Institutions => Set<Institution>();
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<Episode> Episodes => Set<Episode>();
    public DbSet<Professional> Professionals => Set<Professional>();
    public DbSet<InstitutionProfessional> InstitutionProfessionals => Set<InstitutionProfessional>();
    public DbSet<TestCatalog> TestCatalogs => Set<TestCatalog>();
    public DbSet<TestResult> TestResults => Set<TestResult>();
    public DbSet<MedicalOrder> MedicalOrders => Set<MedicalOrder>();
    public DbSet<Extraction> Extractions => Set<Extraction>();
    public DbSet<Sample> Samples => Set<Sample>();
    public DbSet<Shipment> Shipments => Set<Shipment>();
    public DbSet<LabResult> LabResults => Set<LabResult>();
    public DbSet<IntegratedReport> IntegratedReports => Set<IntegratedReport>();
    public DbSet<TherapyProposal> TherapyProposals => Set<TherapyProposal>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Parameters> Parameters => Set<Parameters>();
    public DbSet<FinanceLedger> FinanceLedgers => Set<FinanceLedger>();
    public DbSet<EpisodeDocument> Documents => Set<EpisodeDocument>();
    public DbSet<DocumentSignature> DocumentSignatures => Set<DocumentSignature>();
    public DbSet<EpisodeAssignment> EpisodeAssignments => Set<EpisodeAssignment>();

    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.HasPostgresExtension("uuid-ossp");

        builder.Entity<Institution>(entity =>
        {
            entity.HasIndex(i => i.CUIT).IsUnique();
            entity.Property(i => i.Nombre).HasMaxLength(200);
            entity.Property(i => i.Email).HasMaxLength(200);
        });

        builder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(u => u.Nombre).HasMaxLength(100);
            entity.Property(u => u.Apellido).HasMaxLength(100);
            entity.HasOne(u => u.Institution)
                .WithMany(i => i.Users)
                .HasForeignKey(u => u.InstitutionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(u => u.Professional)
                .WithOne(p => p.User)
                .HasForeignKey<ApplicationUser>(u => u.ProfessionalId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<Professional>(entity =>
        {
            entity.HasIndex(p => p.Email).IsUnique();
            entity.HasIndex(p => p.Matricula).IsUnique();
            entity.Property(p => p.Nombre).HasMaxLength(100);
            entity.Property(p => p.Apellido).HasMaxLength(100);
            entity.Property(p => p.Especialidad).HasMaxLength(150);
            entity.Property(p => p.Telefono).HasMaxLength(50);
            entity.Property(p => p.Email).HasMaxLength(200);
        });

        builder.Entity<InstitutionProfessional>(entity =>
        {
            entity.HasKey(ip => new { ip.InstitutionId, ip.ProfessionalId });

            entity.HasOne(ip => ip.Institution)
                .WithMany(i => i.Profesionales)
                .HasForeignKey(ip => ip.InstitutionId);

            entity.HasOne(ip => ip.Professional)
                .WithMany(p => p.Instituciones)
                .HasForeignKey(ip => ip.ProfessionalId);

            entity.Property(ip => ip.Rol).HasMaxLength(80);
        });

        builder.Entity<Patient>(entity =>
        {
            entity.HasIndex(p => p.DNI).IsUnique();
            entity.Property(p => p.DNI).HasMaxLength(20);
            entity.Property(p => p.Nombre).HasMaxLength(120);
            entity.Property(p => p.Apellido).HasMaxLength(120);
        });

        builder.Entity<Episode>(entity =>
        {
            entity.HasIndex(e => e.Codigo).IsUnique();
            entity.Property(e => e.Codigo).HasMaxLength(64);
            entity.Property(e => e.Titulo).HasMaxLength(200);
            entity.Property(e => e.Urgencia).HasMaxLength(20);
            entity.HasOne(e => e.Patient)
                .WithMany(p => p.Episodes)
                .HasForeignKey(e => e.PatientId);

            entity.HasOne(e => e.Institution)
                .WithMany(i => i.Episodes)
                .HasForeignKey(e => e.InstitutionId);

            entity.HasOne(e => e.Professional)
                .WithMany(p => p.EpisodiosResponsables)
                .HasForeignKey(e => e.ProfessionalId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.Property(e => e.Estado)
                .HasConversion<string>();

            entity.Property(e => e.FechasHitos)
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new Dictionary<string, DateTimeOffset>(), SerializerOptions),
                    v => string.IsNullOrWhiteSpace(v)
                        ? new Dictionary<string, DateTimeOffset>()
                        : JsonSerializer.Deserialize<Dictionary<string, DateTimeOffset>>(v, SerializerOptions) ?? new Dictionary<string, DateTimeOffset>())
                .HasColumnType("jsonb");
        });

        builder.Entity<TestResult>(entity =>
        {
            entity.Property(tr => tr.Puntajes)
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new Dictionary<string, decimal>(), SerializerOptions),
                    v => string.IsNullOrWhiteSpace(v)
                        ? new Dictionary<string, decimal>()
                        : JsonSerializer.Deserialize<Dictionary<string, decimal>>(v, SerializerOptions) ?? new Dictionary<string, decimal>())
                .HasColumnType("jsonb");
        });

        builder.Entity<MedicalOrder>(entity =>
        {
            entity.HasOne(mo => mo.Episode)
                .WithOne(e => e.MedicalOrder)
                .HasForeignKey<MedicalOrder>(mo => mo.EpisodeId);

            entity.Property(mo => mo.Items)
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new List<MedicalOrderItem>(), SerializerOptions),
                    v => string.IsNullOrWhiteSpace(v)
                        ? new List<MedicalOrderItem>()
                        : JsonSerializer.Deserialize<List<MedicalOrderItem>>(v, SerializerOptions) ?? new List<MedicalOrderItem>())
                .HasColumnType("jsonb");

            entity.Property(mo => mo.Destino).HasConversion<int>();
        });

        builder.Entity<Extraction>(entity =>
        {
            entity.HasOne(ex => ex.Episode)
                .WithOne(e => e.Extraction)
                .HasForeignKey<Extraction>(ex => ex.EpisodeId);

            entity.Property(ex => ex.Evidencias)
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new Dictionary<string, string>(), SerializerOptions),
                    v => string.IsNullOrWhiteSpace(v)
                        ? new Dictionary<string, string>()
                        : JsonSerializer.Deserialize<Dictionary<string, string>>(v, SerializerOptions) ?? new Dictionary<string, string>())
                .HasColumnType("jsonb");
        });

        builder.Entity<Sample>(entity =>
        {
            entity.Property(s => s.Clasificacion).HasConversion<int>();
            entity.Property(s => s.Checklist)
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new Dictionary<string, bool>(), SerializerOptions),
                    v => string.IsNullOrWhiteSpace(v)
                        ? new Dictionary<string, bool>()
                        : JsonSerializer.Deserialize<Dictionary<string, bool>>(v, SerializerOptions) ?? new Dictionary<string, bool>())
                .HasColumnType("jsonb");
        });

        builder.Entity<Shipment>(entity =>
        {
            entity.Property(s => s.Destino).HasConversion<int>();
            entity.Property(s => s.Etiquetas)
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new Dictionary<string, string>(), SerializerOptions),
                    v => string.IsNullOrWhiteSpace(v)
                        ? new Dictionary<string, string>()
                        : JsonSerializer.Deserialize<Dictionary<string, string>>(v, SerializerOptions) ?? new Dictionary<string, string>())
                .HasColumnType("jsonb");

            entity.Property(s => s.Evidencias)
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new Dictionary<string, string>(), SerializerOptions),
                    v => string.IsNullOrWhiteSpace(v)
                        ? new Dictionary<string, string>()
                        : JsonSerializer.Deserialize<Dictionary<string, string>>(v, SerializerOptions) ?? new Dictionary<string, string>())
                .HasColumnType("jsonb");
        });

        builder.Entity<LabResult>(entity =>
        {
            entity.Property(lr => lr.Valores)
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new Dictionary<string, string>(), SerializerOptions),
                    v => string.IsNullOrWhiteSpace(v)
                        ? new Dictionary<string, string>()
                        : JsonSerializer.Deserialize<Dictionary<string, string>>(v, SerializerOptions) ?? new Dictionary<string, string>())
                .HasColumnType("jsonb");
        });

        builder.Entity<TherapyProposal>(entity =>
        {
            entity.Property(tp => tp.Tipo).HasConversion<int>();
            entity.Property(tp => tp.Enviados)
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new List<ProposalDeliveryLog>(), SerializerOptions),
                    v => string.IsNullOrWhiteSpace(v)
                        ? new List<ProposalDeliveryLog>()
                        : JsonSerializer.Deserialize<List<ProposalDeliveryLog>>(v, SerializerOptions) ?? new List<ProposalDeliveryLog>())
                .HasColumnType("jsonb");
        });

        builder.Entity<Notification>(entity =>
        {
            entity.HasOne(n => n.Episode)
                .WithMany()
                .HasForeignKey(n => n.EpisodeId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.Property(n => n.Canal).HasConversion<int>();
            entity.Property(n => n.Payload)
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new Dictionary<string, object>(), SerializerOptions),
                    v => string.IsNullOrWhiteSpace(v)
                        ? new Dictionary<string, object>()
                        : JsonSerializer.Deserialize<Dictionary<string, object>>(v, SerializerOptions) ?? new Dictionary<string, object>())
                .HasColumnType("jsonb");
        });

        builder.Entity<EpisodeDocument>(entity =>
        {
            entity.Property(d => d.Tipo).HasMaxLength(50);
            entity.Property(d => d.Nombre).HasMaxLength(200);
            entity.Property(d => d.Version).HasMaxLength(20);
            entity.Property(d => d.PdfUrl).HasMaxLength(500);
            entity.Property(d => d.Hash).HasMaxLength(256);
            entity.Property(d => d.StorageProvider).HasMaxLength(100);

            entity.HasOne(d => d.Episode)
                .WithMany(e => e.Documents)
                .HasForeignKey(d => d.EpisodeId);

            entity.HasOne(d => d.SubidoPorUser)
                .WithMany()
                .HasForeignKey(d => d.SubidoPorUserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(d => d.SubidoPorProfessional)
                .WithMany()
                .HasForeignKey(d => d.SubidoPorProfessionalId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(d => d.FirmadoPorUser)
                .WithMany()
                .HasForeignKey(d => d.FirmadoPorUserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(d => d.FirmadoPorProfessional)
                .WithMany()
                .HasForeignKey(d => d.FirmadoPorProfessionalId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<DocumentSignature>(entity =>
        {
            entity.Property(ds => ds.Proveedor).HasMaxLength(100);
            entity.Property(ds => ds.Estado).HasMaxLength(50);
            entity.Property(ds => ds.HashDocumento).HasMaxLength(256);
            entity.Property(ds => ds.Motivo).HasMaxLength(200);

            entity.HasOne(ds => ds.EpisodeDocument)
                .WithMany(d => d.Firmas)
                .HasForeignKey(ds => ds.EpisodeDocumentId);

            entity.HasOne(ds => ds.FirmadoPorUser)
                .WithMany()
                .HasForeignKey(ds => ds.FirmadoPorUserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(ds => ds.FirmadoPorProfessional)
                .WithMany()
                .HasForeignKey(ds => ds.FirmadoPorProfessionalId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<EpisodeAssignment>(entity =>
        {
            entity.Property(ea => ea.Rol).HasMaxLength(100);
            entity.Property(ea => ea.Notas).HasMaxLength(500);

            entity.HasOne(ea => ea.Episode)
                .WithMany(e => e.Assignments)
                .HasForeignKey(ea => ea.EpisodeId);

            entity.HasOne(ea => ea.Professional)
                .WithMany(p => p.AsignacionesRecibidas)
                .HasForeignKey(ea => ea.ProfessionalId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ea => ea.AssignedByProfessional)
                .WithMany(p => p.AsignacionesDerivadas)
                .HasForeignKey(ea => ea.AssignedByProfessionalId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<AuditLog>(entity =>
        {
            entity.Property(al => al.Diff)
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new Dictionary<string, object?>(), SerializerOptions),
                    v => string.IsNullOrWhiteSpace(v)
                        ? new Dictionary<string, object?>()
                        : JsonSerializer.Deserialize<Dictionary<string, object?>>(v, SerializerOptions) ?? new Dictionary<string, object?>())
                .HasColumnType("jsonb");
        });

        builder.Entity<Parameters>(entity =>
        {
            entity.HasOne(p => p.Institution)
                .WithOne(i => i.Parameters)
                .HasForeignKey<Parameters>(p => p.InstitutionId);

            entity.Property(p => p.TestsHabilitados)
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new Dictionary<string, object>(), SerializerOptions),
                    v => string.IsNullOrWhiteSpace(v)
                        ? new Dictionary<string, object>()
                        : JsonSerializer.Deserialize<Dictionary<string, object>>(v, SerializerOptions) ?? new Dictionary<string, object>())
                .HasColumnType("jsonb");
            entity.Property(p => p.CatalogoEstudios)
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new Dictionary<string, object>(), SerializerOptions),
                    v => string.IsNullOrWhiteSpace(v)
                        ? new Dictionary<string, object>()
                        : JsonSerializer.Deserialize<Dictionary<string, object>>(v, SerializerOptions) ?? new Dictionary<string, object>())
                .HasColumnType("jsonb");
            entity.Property(p => p.SLAs)
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new Dictionary<string, object>(), SerializerOptions),
                    v => string.IsNullOrWhiteSpace(v)
                        ? new Dictionary<string, object>()
                        : JsonSerializer.Deserialize<Dictionary<string, object>>(v, SerializerOptions) ?? new Dictionary<string, object>())
                .HasColumnType("jsonb");
            entity.Property(p => p.Plantillas)
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new Dictionary<string, object>(), SerializerOptions),
                    v => string.IsNullOrWhiteSpace(v)
                        ? new Dictionary<string, object>()
                        : JsonSerializer.Deserialize<Dictionary<string, object>>(v, SerializerOptions) ?? new Dictionary<string, object>())
                .HasColumnType("jsonb");
        });
    }
}
