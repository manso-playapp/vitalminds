using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VitalMinds.Clinic.Api.Application.Requests;
using VitalMinds.Clinic.Api.Application.Responses;
using VitalMinds.Clinic.Api.Domain.Entities;
using VitalMinds.Clinic.Api.Domain.Enums;

namespace VitalMinds.Clinic.Api.Endpoints;

public static class EpisodeEndpoints
{
    public static IEndpointRouteBuilder MapEpisodeEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/episodes")
            .WithTags("Episodes")
            .RequireAuthorization();

        group.MapPost("/", CreateEpisodeAsync)
            .RequireAuthorization(policy => policy.RequireRole(Roles.Superadmin, Roles.InstitutionAdmin, Roles.Psychologist));

        group.MapGet("/", GetEpisodesAsync)
            .RequireAuthorization();

        group.MapGet("/{id:guid}", GetEpisodeByIdAsync);
        group.MapGet("/{id:guid}/assignments", GetEpisodeAssignmentsAsync);

        group.MapPost("/{id:guid}/tests", AddTestResultAsync)
            .RequireAuthorization(policy => policy.RequireRole(Roles.Psychologist));

        group.MapPost("/{id:guid}/derive-to-doctor", DeriveToDoctorAsync)
            .RequireAuthorization(policy => policy.RequireRole(Roles.Psychologist));

        group.MapPost("/{id:guid}/psych-ok-no-derivation", PsychOkNoDerivationAsync)
            .RequireAuthorization(policy => policy.RequireRole(Roles.Psychologist));

        group.MapPost("/{id:guid}/medical-order", CreateMedicalOrderAsync)
            .RequireAuthorization(policy => policy.RequireRole(Roles.Physician));

        group.MapPost("/{id:guid}/extractions", CreateExtractionAsync)
            .RequireAuthorization(policy => policy.RequireRole(Roles.Phlebotomist, Roles.InstitutionAdmin));

        group.MapPatch("/extractions/{extractionId:guid}/status", UpdateExtractionStatusAsync)
            .RequireAuthorization(policy => policy.RequireRole(Roles.Phlebotomist, Roles.InstitutionAdmin));

        group.MapPost("/{id:guid}/lab-results", RegisterLabResultAsync)
            .RequireAuthorization(policy => policy.RequireRole(Roles.Laboratory));

        group.MapPost("/{id:guid}/integrated-report", CreateIntegratedReportAsync)
            .RequireAuthorization(policy => policy.RequireRole(Roles.Psychologist, Roles.Physician));

        group.MapPost("/{id:guid}/proposal", CreateProposalAsync)
            .RequireAuthorization(policy => policy.RequireRole(Roles.Psychologist, Roles.InstitutionAdmin));

        group.MapPost("/{id:guid}/proposal/send", SendProposalAsync)
            .RequireAuthorization(policy => policy.RequireRole(Roles.Psychologist, Roles.InstitutionAdmin));

        group.MapPost("/{id:guid}/survey", RegisterSurveyAsync)
            .RequireAuthorization(policy => policy.RequireRole(Roles.Psychologist, Roles.InstitutionAdmin));

        group.MapGet("/{id:guid}/timeline", GetTimelineAsync);

        return app;
    }

    private static async Task<IResult> GetEpisodesAsync(
        ApplicationDbContext dbContext,
        [FromQuery] Guid? institutionId,
        [FromQuery] Guid? professionalId)
    {
        var query = dbContext.Episodes
            .AsNoTracking()
            .Include(e => e.Patient)
            .Include(e => e.Institution)
            .Include(e => e.Professional)
            .OrderByDescending(e => e.FechaAlta)
            .AsQueryable();

        if (institutionId.HasValue)
        {
            query = query.Where(e => e.InstitutionId == institutionId.Value);
        }

        if (professionalId.HasValue)
        {
            query = query.Where(e => e.ProfessionalId == professionalId.Value);
        }

        var episodes = await query.Take(100).ToListAsync();

        var data = episodes.Select(e => new EpisodeListItemResponse(
            e.Id,
            e.Codigo,
            e.Titulo,
            e.FechaAlta,
            $"{e.Patient.Apellido}, {e.Patient.Nombre}",
            e.Professional is null ? "—" : $"{e.Professional.Apellido}, {e.Professional.Nombre}",
            e.Institution.Nombre,
            e.Estado,
            e.Urgencia));

        return Results.Ok(new { ok = true, data });
    }

    private static async Task<IResult> CreateEpisodeAsync(
        [FromBody] CreateEpisodeRequest request,
        UserManager<ApplicationUser> userManager,
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        AuditService auditService)
    {
        var currentUser = await userManager.GetUserAsync(user);
        if (currentUser is null)
        {
            return Results.Unauthorized();
        }

        var patient = await dbContext.Patients.FindAsync(request.PatientId);
        if (patient is null)
        {
            return Results.NotFound(new { message = "Paciente no encontrado" });
        }

        var institution = await dbContext.Institutions.FindAsync(request.InstitutionId);
        if (institution is null)
        {
            return Results.NotFound(new { message = "Institución no encontrada" });
        }

        var professional = await dbContext.Professionals
            .Include(p => p.Instituciones)
            .FirstOrDefaultAsync(p => p.Id == request.ProfessionalId);
        if (professional is null)
        {
            return Results.NotFound(new { message = "Profesional no encontrado" });
        }

        var pertenece = professional.Instituciones.Any(ip => ip.InstitutionId == institution.Id && ip.Activo);
        if (!pertenece)
        {
            return Results.BadRequest(new { message = "El profesional no está asociado a la institución" });
        }

        var episode = new Episode
        {
            Id = Guid.NewGuid(),
            Codigo = GenerateEpisodeCode(institution.Id),
            Titulo = request.Titulo,
            PatientId = patient.Id,
            InstitutionId = institution.Id,
            ProfessionalId = professional.Id,
            CreatedByUserId = currentUser.Id,
            Estado = EpisodeState.CREADO,
            Urgencia = "verde",
            FechasHitos = new Dictionary<string, DateTimeOffset>
            {
                { EpisodeState.CREADO.ToString(), DateTimeOffset.UtcNow }
            },
            Notas = request.Notas,
            ResponsableId = professional.UserId ?? currentUser.Id
        };

        dbContext.Episodes.Add(episode);
        var assignment = new EpisodeAssignment
        {
            Id = Guid.NewGuid(),
            EpisodeId = episode.Id,
            ProfessionalId = professional.Id,
            AssignedByProfessionalId = currentUser.ProfessionalId,
            Rol = professional.Especialidad,
            FechaAsignacion = DateTimeOffset.UtcNow
        };

        dbContext.EpisodeAssignments.Add(assignment);
        await dbContext.SaveChangesAsync();

        await auditService.LogAsync(nameof(Episode), episode.Id.ToString(), "CREATE");

        return Results.Created($"/episodes/{episode.Id}", ToResponse(episode));
    }

    private static async Task<IResult> GetEpisodeByIdAsync(Guid id, ApplicationDbContext dbContext)
    {
        var episode = await dbContext.Episodes
            .Include(e => e.Patient)
            .Include(e => e.Institution)
            .Include(e => e.Professional)
            .Include(e => e.Professional)
            .Include(e => e.TestResults)
            .Include(e => e.MedicalOrder)
            .Include(e => e.Extraction)
            .ThenInclude(ex => ex!.Samples)
            .Include(e => e.Extraction)
            .ThenInclude(ex => ex!.Shipments)
            .Include(e => e.LabResults)
            .Include(e => e.IntegratedReports)
            .Include(e => e.TherapyProposals)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (episode is null)
        {
            return Results.NotFound(new { message = "Episodio no encontrado" });
        }

        return Results.Ok(new
        {
            ok = true,
            data = new
            {
                Episode = ToResponse(episode),
                Patient = episode.Patient,
                Institution = episode.Institution,
                Tests = episode.TestResults,
                MedicalOrder = episode.MedicalOrder,
                Extraction = episode.Extraction,
                LabResults = episode.LabResults,
                Reports = episode.IntegratedReports,
                Proposals = episode.TherapyProposals
            }
        });
    }

    private static async Task<IResult> AddTestResultAsync(
        Guid id,
        [FromBody] AddTestResultRequest request,
        ApplicationDbContext dbContext,
        AuditService auditService,
        BypassEvaluationService bypassService)
    {
        var episode = await dbContext.Episodes
            .Include(e => e.Patient)
            .Include(e => e.Institution)
            .Include(e => e.TestResults)
            .Include(e => e.Institution).ThenInclude(i => i.Parameters)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (episode is null)
        {
            return Results.NotFound(new { message = "Episodio no encontrado" });
        }

        var testCatalog = await dbContext.TestCatalogs.FindAsync(request.TestCatalogId);
        if (testCatalog is null)
        {
            return Results.BadRequest(new { message = "Test no válido" });
        }

        var testResult = new TestResult
        {
            EpisodeId = episode.Id,
            TestCatalogId = testCatalog.Id,
            Puntajes = request.Puntajes,
            Interpretacion = request.Interpretacion,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.TestResults.Add(testResult);

        episode.Estado = EpisodeState.EVAL_PSICO_EN_PROCESO;
        episode.FechasHitos ??= new Dictionary<string, DateTimeOffset>();
        episode.FechasHitos[EpisodeState.EVAL_PSICO_EN_PROCESO.ToString()] = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync();
        await auditService.LogAsync(nameof(Episode), episode.Id.ToString(), "ADD_TEST_RESULT", new Dictionary<string, object?>
        {
            { "testCatalogId", testCatalog.Id },
            { "puntajes", request.Puntajes },
            { "interpretacion", request.Interpretacion }
        });

        var bypassEligible = false;
        if (episode.Institution.Parameters is not null)
        {
            bypassEligible = bypassService.Evaluate(
                request.Puntajes,
                new Dictionary<string, bool>(),
                episode.Institution.Parameters);
        }

        return Results.Ok(new
        {
            ok = true,
            data = new
            {
                TestResult = testResult,
                BypassSugerido = bypassEligible
            }
        });
    }

    private static async Task<IResult> DeriveToDoctorAsync(
        Guid id,
        [FromBody] DeriveToDoctorRequest request,
        ApplicationDbContext dbContext,
        AuditService auditService)
    {
        var episode = await dbContext.Episodes.FindAsync(id);
        if (episode is null)
        {
            return Results.NotFound(new { message = "Episodio no encontrado" });
        }

        if (episode.Estado != EpisodeState.EVAL_PSICO_EN_PROCESO && episode.Estado != EpisodeState.CREADO)
        {
            return Results.BadRequest(new { message = "Estado inválido para derivación" });
        }

        episode.Estado = EpisodeState.DERIVADO_A_MEDICO;
        episode.FechasHitos ??= new Dictionary<string, DateTimeOffset>();
        episode.FechasHitos[EpisodeState.DERIVADO_A_MEDICO.ToString()] = DateTimeOffset.UtcNow;
        episode.Notas = request.Nota;

        await dbContext.SaveChangesAsync();
        await auditService.LogAsync(nameof(Episode), episode.Id.ToString(), "DERIVE_TO_DOCTOR");

        return Results.Ok(new { ok = true, data = ToResponse(episode) });
    }

    private static async Task<IResult> PsychOkNoDerivationAsync(
        Guid id,
        [FromBody] PsychOkNoDerivationRequest request,
        ApplicationDbContext dbContext,
        AuditService auditService)
    {
        var episode = await dbContext.Episodes.FindAsync(id);
        if (episode is null)
        {
            return Results.NotFound(new { message = "Episodio no encontrado" });
        }

        if (episode.Estado != EpisodeState.EVAL_PSICO_EN_PROCESO && episode.Estado != EpisodeState.CREADO)
        {
            return Results.BadRequest(new { message = "Estado inválido para cierre por psicología" });
        }

        episode.Estado = EpisodeState.EVAL_PSICO_OK_SIN_DERIVACION;
        episode.FechasHitos ??= new Dictionary<string, DateTimeOffset>();
        episode.FechasHitos[EpisodeState.EVAL_PSICO_OK_SIN_DERIVACION.ToString()] = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync();
        await auditService.LogAsync(nameof(Episode), episode.Id.ToString(), "PSYCH_OK_NO_DERIVATION", new Dictionary<string, object?>
        {
            { "flags", request.ClinicalFlags }
        });

        return Results.Ok(new { ok = true, data = ToResponse(episode) });
    }

    private static async Task<IResult> CreateMedicalOrderAsync(
        Guid id,
        [FromBody] MedicalOrderRequest request,
        ClaimsPrincipal user,
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext dbContext,
        AuditService auditService,
        PdfService pdfService)
    {
        var episode = await dbContext.Episodes
            .Include(e => e.Patient)
            .Include(e => e.Institution)
            .Include(e => e.MedicalOrder)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (episode is null)
        {
            return Results.NotFound(new { message = "Episodio no encontrado" });
        }

        if (episode.Estado != EpisodeState.DERIVADO_A_MEDICO)
        {
            return Results.BadRequest(new { message = "Estado inválido para pedido médico" });
        }

        var currentUser = await userManager.GetUserAsync(user);
        if (currentUser is null)
        {
            return Results.Unauthorized();
        }

        var medicalOrder = new MedicalOrder
        {
            EpisodeId = episode.Id,
            Items = request.Items.Select(item => new MedicalOrderItem
            {
                Codigo = item.Codigo,
                Nombre = item.Nombre,
                Complejidad = item.Complejidad,
                ValorArs = item.ValorArs,
                RequiereAutorizacion = item.RequiereAutorizacion
            }).ToList(),
            Destino = request.Destino,
            FirmanteUserId = currentUser.Id,
            Firmante = currentUser,
            PdfPath = string.Empty
        };

        var pdfDirectory = Path.Combine("storage", "medical-orders");
        var pdfPath = await pdfService.GenerateMedicalOrderAsync(episode, medicalOrder, pdfDirectory);
        medicalOrder.PdfPath = pdfPath;

        dbContext.MedicalOrders.Add(medicalOrder);

        episode.Estado = EpisodeState.PEDIDO_LAB_EMITIDO;
        episode.FechasHitos ??= new Dictionary<string, DateTimeOffset>();
        episode.FechasHitos[EpisodeState.PEDIDO_LAB_EMITIDO.ToString()] = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync();
        await auditService.LogAsync(nameof(Episode), episode.Id.ToString(), "CREATE_MEDICAL_ORDER");

        return Results.Ok(new { ok = true, data = medicalOrder });
    }

    private static async Task<IResult> CreateExtractionAsync(
        Guid id,
        [FromBody] ExtractionRequest request,
        UserManager<ApplicationUser> userManager,
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        AuditService auditService)
    {
        var episode = await dbContext.Episodes
            .Include(e => e.Extraction)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (episode is null)
        {
            return Results.NotFound(new { message = "Episodio no encontrado" });
        }

        if (episode.Estado != EpisodeState.PEDIDO_LAB_EMITIDO)
        {
            return Results.BadRequest(new { message = "Estado inválido para programar extracción" });
        }

        var currentUser = await userManager.GetUserAsync(user);
        if (currentUser is null)
        {
            return Results.Unauthorized();
        }

        var extraction = new Extraction
        {
            EpisodeId = episode.Id,
            ExtraccionistaUserId = currentUser.Id,
            Fecha = request.Fecha,
            Franja = request.Franja,
            Estado = request.Estado,
            Evidencias = request.Evidencias
        };

        dbContext.Extractions.Add(extraction);

        episode.Estado = EpisodeState.EXTRACCION_PROGRAMADA;
        episode.FechasHitos ??= new Dictionary<string, DateTimeOffset>();
        episode.FechasHitos[EpisodeState.EXTRACCION_PROGRAMADA.ToString()] = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync();
        await auditService.LogAsync(nameof(Episode), episode.Id.ToString(), "CREATE_EXTRACTION");

        return Results.Ok(new { ok = true, data = extraction });
    }

    private static async Task<IResult> UpdateExtractionStatusAsync(
        Guid extractionId,
        [FromBody] ExtractionStatusRequest request,
        ApplicationDbContext dbContext,
        AuditService auditService)
    {
        var extraction = await dbContext.Extractions
            .Include(e => e.Episode)
            .FirstOrDefaultAsync(e => e.Id == extractionId);

        if (extraction is null)
        {
            return Results.NotFound(new { message = "Extracción no encontrada" });
        }

        extraction.Estado = request.Estado;

        if (request.Estado == "MuestrasEnRuta")
        {
            extraction.Episode.Estado = EpisodeState.MUESTRAS_EN_RUTA;
            extraction.Episode.FechasHitos ??= new Dictionary<string, DateTimeOffset>();
            extraction.Episode.FechasHitos[EpisodeState.MUESTRAS_EN_RUTA.ToString()] = DateTimeOffset.UtcNow;
        }

        await dbContext.SaveChangesAsync();
        await auditService.LogAsync(nameof(Extraction), extraction.Id.ToString(), "UPDATE_STATUS", new Dictionary<string, object?>
        {
            { "estado", request.Estado }
        });

        return Results.Ok(new { ok = true });
    }

    private static async Task<IResult> RegisterLabResultAsync(
        Guid id,
        [FromBody] LabResultRequest request,
        ApplicationDbContext dbContext,
        AuditService auditService,
        NotificationService notificationService)
    {
        var episode = await dbContext.Episodes
            .Include(e => e.LabResults)
            .Include(e => e.Patient)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (episode is null)
        {
            return Results.NotFound(new { message = "Episodio no encontrado" });
        }

        if (episode.Estado != EpisodeState.ANALISIS_EN_PROCESO && episode.Estado != EpisodeState.MUESTRAS_EN_RUTA)
        {
            return Results.BadRequest(new { message = "Estado inválido para cargar resultados" });
        }

        var labResult = new LabResult
        {
            EpisodeId = episode.Id,
            PdfPath = request.PdfPath,
            Valores = request.Valores,
            Proveedor = request.Proveedor,
            Firmado = request.Firmado,
            EnviadoPaciente = request.EnviarAlPaciente,
            FacturadoObraSocial = request.FacturadoObraSocial
        };

        dbContext.LabResults.Add(labResult);

        episode.Estado = EpisodeState.RESULTADOS_DISPONIBLES;
        episode.FechasHitos ??= new Dictionary<string, DateTimeOffset>();
        episode.FechasHitos[EpisodeState.RESULTADOS_DISPONIBLES.ToString()] = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync();
        await auditService.LogAsync(nameof(Episode), episode.Id.ToString(), "LAB_RESULTS_UPLOADED");

        if (request.EnviarAlPaciente && !string.IsNullOrEmpty(episode.Patient.Email))
        {
            await notificationService.SendAsync(new Notification
            {
                ToEmail = episode.Patient.Email,
                Canal = NotificationChannel.Email,
                Template = "lab_results_available",
                Payload = new Dictionary<string, object>
                {
                    { "episodeId", episode.Id },
                    { "patientName", $"{episode.Patient.Nombre} {episode.Patient.Apellido}" },
                    { "link", request.PdfPath }
                }
            });
        }

        return Results.Ok(new { ok = true, data = labResult });
    }

    private static async Task<IResult> CreateIntegratedReportAsync(
        Guid id,
        [FromBody] IntegratedReportRequest request,
        ClaimsPrincipal user,
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext dbContext,
        AuditService auditService,
        PdfService pdfService)
    {
        var episode = await dbContext.Episodes
            .Include(e => e.Patient)
            .Include(e => e.Institution)
            .Include(e => e.IntegratedReports)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (episode is null)
        {
            return Results.NotFound(new { message = "Episodio no encontrado" });
        }

        if (episode.Estado != EpisodeState.RESULTADOS_DISPONIBLES &&
            episode.Estado != EpisodeState.EVAL_PSICO_OK_SIN_DERIVACION)
        {
            return Results.BadRequest(new { message = "Estado inválido para informe integrado" });
        }

        var currentUser = await userManager.GetUserAsync(user);
        if (currentUser is null)
        {
            return Results.Unauthorized();
        }

        var report = new IntegratedReport
        {
            EpisodeId = episode.Id,
            PdfPath = request.PdfPath,
            FirmadoPorUserId = currentUser.Id,
            FirmadoPor = currentUser,
            TipoInforme = request.TipoInforme,
            Version = $"v{episode.IntegratedReports.Count + 1}"
        };

        var pdfDirectory = Path.Combine("storage", "reports");
        var pdfPath = await pdfService.GenerateIntegratedReportAsync(episode, report, pdfDirectory);
        report.PdfPath = pdfPath;

        dbContext.IntegratedReports.Add(report);

        episode.Estado = EpisodeState.INFORME_INTEGRADO_LISTO;
        episode.FechasHitos ??= new Dictionary<string, DateTimeOffset>();
        episode.FechasHitos[EpisodeState.INFORME_INTEGRADO_LISTO.ToString()] = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync();
        await auditService.LogAsync(nameof(Episode), episode.Id.ToString(), "INTEGRATED_REPORT_CREATED");

        return Results.Ok(new { ok = true, data = report });
    }

    private static async Task<IResult> CreateProposalAsync(
        Guid id,
        [FromBody] TherapyProposalRequest request,
        ApplicationDbContext dbContext,
        AuditService auditService)
    {
        var episode = await dbContext.Episodes
            .Include(e => e.TherapyProposals)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (episode is null)
        {
            return Results.NotFound(new { message = "Episodio no encontrado" });
        }

        if (episode.Estado != EpisodeState.INFORME_INTEGRADO_LISTO)
        {
            return Results.BadRequest(new { message = "Estado inválido para propuesta" });
        }

        var proposal = new TherapyProposal
        {
            EpisodeId = episode.Id,
            Tipo = request.Tipo,
            Detalles = request.Detalles,
            ValorConfig = request.ValorConfig,
            Aceptada = request.Aceptada ?? false,
            Fecha = request.Fecha
        };

        dbContext.TherapyProposals.Add(proposal);
        episode.Estado = EpisodeState.PROPUESTA_EMITIDA;
        episode.FechasHitos ??= new Dictionary<string, DateTimeOffset>();
        episode.FechasHitos[EpisodeState.PROPUESTA_EMITIDA.ToString()] = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync();
        await auditService.LogAsync(nameof(Episode), episode.Id.ToString(), "THERAPY_PROPOSAL_CREATED");

        return Results.Ok(new { ok = true, data = proposal });
    }

    private static async Task<IResult> SendProposalAsync(
        Guid id,
        [FromBody] ProposalSendRequest request,
        ApplicationDbContext dbContext,
        NotificationService notificationService,
        AuditService auditService)
    {
        var episode = await dbContext.Episodes
            .Include(e => e.Patient)
            .Include(e => e.Institution)
            .Include(e => e.TherapyProposals)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (episode is null)
        {
            return Results.NotFound(new { message = "Episodio no encontrado" });
        }

        var proposal = episode.TherapyProposals.FirstOrDefault();
        if (proposal is null)
        {
            return Results.BadRequest(new { message = "Propuesta no encontrada" });
        }

        foreach (var canal in request.Canales)
        {
            NotificationChannel channel = canal.ToLower() switch
            {
                "whatsapp" => NotificationChannel.WhatsApp,
                _ => NotificationChannel.Email
            };

            await notificationService.SendAsync(new Notification
            {
                EpisodeId = episode.Id,
                ToEmail = channel == NotificationChannel.Email ? episode.Patient.Email : null,
                ToPhone = channel == NotificationChannel.WhatsApp ? episode.Patient.Telefono : null,
                Canal = channel,
                Template = "therapy_proposal",
                Payload = new Dictionary<string, object>
                {
                    { "patientFirstName", episode.Patient.Nombre },
                    { "institutionName", episode.Institution.Nombre },
                    { "proposalType", proposal.Tipo.ToString() },
                    { "proposalLink", request.Url }
                }
            });

            proposal.Enviados.Add(new ProposalDeliveryLog
            {
                Canal = channel,
                Estado = "enviado",
                Fecha = DateTimeOffset.UtcNow,
                IntentoId = Guid.NewGuid().ToString()
            });
        }

        episode.Estado = EpisodeState.SEGUIMIENTO;
        episode.FechasHitos ??= new Dictionary<string, DateTimeOffset>();
        episode.FechasHitos[EpisodeState.SEGUIMIENTO.ToString()] = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync();
        await auditService.LogAsync(nameof(Episode), episode.Id.ToString(), "THERAPY_PROPOSAL_SENT");

        return Results.Ok(new { ok = true });
    }

    private static async Task<IResult> RegisterSurveyAsync(
        Guid id,
        [FromBody] SurveyRequest request,
        ApplicationDbContext dbContext,
        AuditService auditService)
    {
        var episode = await dbContext.Episodes.FindAsync(id);
        if (episode is null)
        {
            return Results.NotFound(new { message = "Episodio no encontrado" });
        }

        episode.Estado = EpisodeState.CERRADO;
        episode.ClosedAt = DateTimeOffset.UtcNow;
        episode.FechasHitos ??= new Dictionary<string, DateTimeOffset>();
        episode.FechasHitos[EpisodeState.CERRADO.ToString()] = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync();
        await auditService.LogAsync(nameof(Episode), episode.Id.ToString(), "SURVEY_COMPLETED", new Dictionary<string, object?>
        {
            { "nps", request.Nps },
            { "items", request.Items },
            { "comentario", request.Comentario }
        });

        return Results.Ok(new { ok = true });
    }

    private static async Task<IResult> GetTimelineAsync(Guid id, ApplicationDbContext dbContext)
    {
        var auditLogs = await dbContext.AuditLogs
            .Where(al => al.Entidad == nameof(Episode) && al.EntidadId == id.ToString())
            .OrderBy(al => al.Timestamp)
            .ToListAsync();

        return Results.Ok(new { ok = true, data = auditLogs });
    }

    private static async Task<IResult> GetEpisodeAssignmentsAsync(Guid id, ApplicationDbContext dbContext)
    {
        var assignments = await dbContext.EpisodeAssignments
            .Where(ea => ea.EpisodeId == id)
            .Include(ea => ea.Professional)
            .Include(ea => ea.AssignedByProfessional)
            .OrderBy(ea => ea.FechaAsignacion)
            .ToListAsync();

        var data = assignments.Select(ea => new EpisodeAssignmentResponse(
            ea.Id,
            ea.Rol,
            ea.ProfessionalId,
            $"{ea.Professional.Apellido}, {ea.Professional.Nombre}",
            ea.AssignedByProfessionalId,
            ea.AssignedByProfessional is null ? null : $"{ea.AssignedByProfessional.Apellido}, {ea.AssignedByProfessional.Nombre}",
            ea.FechaAsignacion,
            ea.FechaFinalizacion,
            ea.Notas));

        return Results.Ok(new { ok = true, data });
    }

    private static EpisodeResponse ToResponse(Episode episode) =>
        new(
            episode.Id,
            episode.Codigo,
            episode.Titulo,
            episode.FechaAlta,
            episode.Estado,
            episode.PatientId,
            episode.InstitutionId,
            episode.ProfessionalId,
            episode.FechasHitos,
            episode.CreatedByUserId,
            episode.ResponsableId,
            episode.Notas,
            episode.ClosedAt,
            episode.Urgencia);

    private static string GenerateEpisodeCode(Guid institutionId)
    {
        var prefix = institutionId.ToString("N")[..4].ToUpperInvariant();
        return $"EPI-{prefix}-{DateTime.UtcNow:yyyyMMddHHmmss}";
    }
}
