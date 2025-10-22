using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VitalMinds.Clinic.Api.Application.Requests;
using VitalMinds.Clinic.Api.Application.Responses;
using VitalMinds.Clinic.Api.Data;
using VitalMinds.Clinic.Api.Domain.Entities;
using VitalMinds.Clinic.Api.Domain.Enums;

namespace VitalMinds.Clinic.Api.Endpoints;

public static class ProfessionalEndpoints
{
    public static IEndpointRouteBuilder MapProfessionalEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/professionals")
            .WithTags("Professionals")
            .RequireAuthorization();

        group.MapGet("/", GetProfessionalsAsync)
            .RequireAuthorization(policy => policy.RequireRole(Roles.Superadmin, Roles.InstitutionAdmin));

        group.MapPost("/", CreateProfessionalAsync)
            .RequireAuthorization(policy => policy.RequireRole(Roles.Superadmin));

        return app;
    }

    private static async Task<IResult> GetProfessionalsAsync(
        [FromQuery] Guid? institutionId,
        ApplicationDbContext dbContext)
    {
        var query = dbContext.Professionals
            .AsNoTracking()
            .Include(p => p.Instituciones)
            .ThenInclude(ip => ip.Institution)
            .AsQueryable();

        if (institutionId.HasValue)
        {
            query = query.Where(p => p.Instituciones.Any(ip => ip.InstitutionId == institutionId.Value));
        }

        var professionals = await query.ToListAsync();

        return Results.Ok(new
        {
            ok = true,
            data = professionals.Select(ToResponse)
        });
    }

    private static async Task<IResult> CreateProfessionalAsync(
        [FromBody] CreateProfessionalRequest request,
        ApplicationDbContext dbContext)
    {
        var exists = await dbContext.Professionals
            .AnyAsync(p => p.Email == request.Email || p.Matricula == request.Matricula);
        if (exists)
        {
            return Results.Conflict(new { message = "Ya existe un profesional con ese email o matrícula" });
        }

        var professional = new Professional
        {
            Nombre = request.Nombre,
            Apellido = request.Apellido,
            Especialidad = request.Especialidad,
            Matricula = request.Matricula,
            Telefono = request.Telefono,
            Email = request.Email,
            Direccion = request.Direccion,
            FechaAlta = request.FechaAlta ?? DateOnly.FromDateTime(DateTime.UtcNow),
            Activo = true
        };

        if (request.InstitucionIds is not null)
        {
            var instituciones = await dbContext.Institutions
                .Where(i => request.InstitucionIds.Contains(i.Id))
                .ToListAsync();

            foreach (var institucion in instituciones)
            {
                professional.Instituciones.Add(new InstitutionProfessional
                {
                    InstitutionId = institucion.Id,
                    ProfessionalId = professional.Id,
                    FechaAlta = DateOnly.FromDateTime(DateTime.UtcNow),
                    Activo = true,
                    Rol = "Profesional"
                });
            }
        }

        dbContext.Professionals.Add(professional);
        await dbContext.SaveChangesAsync();

        return Results.Created($"/professionals/{professional.Id}", ToResponse(professional));
    }

    private static ProfessionalResponse ToResponse(Professional professional) =>
        new(
            professional.Id,
            professional.Nombre,
            professional.Apellido,
            professional.Especialidad,
            professional.Matricula,
            professional.FechaAlta,
            professional.Telefono,
            professional.Email,
            professional.Direccion,
            professional.Activo,
            professional.Instituciones.Select(ip => new ProfessionalInstitutionResponse(
                ip.InstitutionId,
                ip.Institution?.Nombre ?? string.Empty,
                ip.Activo,
                ip.FechaAlta)));
}
