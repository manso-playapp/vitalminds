using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VitalMinds.Clinic.Api.Application.Requests;
using VitalMinds.Clinic.Api.Application.Responses;
using VitalMinds.Clinic.Api.Domain.Enums;

namespace VitalMinds.Clinic.Api.Endpoints;

public static class InstitutionEndpoints
{
    public static IEndpointRouteBuilder MapInstitutionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/institutions")
            .WithTags("Institutions");

        group.MapPost("/", CreateInstitutionAsync)
            .RequireAuthorization(policy => policy.RequireRole(Roles.Superadmin));

        group.MapGet("/", GetInstitutionsAsync)
            .RequireAuthorization(policy => policy.RequireRole(Roles.Superadmin));

        group.MapGet("/{id:guid}", GetInstitutionByIdAsync)
            .RequireAuthorization(policy => policy.RequireRole(Roles.Superadmin, Roles.InstitutionAdmin));

        return app;
    }

    private static async Task<IResult> GetInstitutionsAsync(
        [FromQuery] string? search,
        ApplicationDbContext dbContext)
    {
        var query = dbContext.Institutions.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lowered = search.Trim().ToLowerInvariant();
            query = query.Where(i =>
                i.Nombre.ToLower().Contains(lowered) ||
                i.RazonSocial.ToLower().Contains(lowered) ||
                i.CUIT.ToLower().Contains(lowered));
        }

        var institutions = await query
            .OrderBy(i => i.Nombre)
            .Take(200)
            .ToListAsync();

        return Results.Ok(new
        {
            ok = true,
            data = institutions.Select(ToResponse)
        });
    }

    private static async Task<IResult> CreateInstitutionAsync(
        [FromBody] CreateInstitutionRequest request,
        ApplicationDbContext dbContext)
    {
        var institution = new Institution
        {
            Nombre = request.Nombre,
            CUIT = request.CUIT,
            RazonSocial = request.RazonSocial,
            CondicionIVA = request.CondicionIVA,
            Email = request.Email,
            Telefono = request.Telefono,
            Direccion = request.Direccion,
            Banco = request.Banco,
            CBU = request.CBU,
            AliasCBU = request.AliasCBU,
            EsProfesionalIndependiente = request.EsProfesionalIndependiente,
            Activa = true
        };

        dbContext.Institutions.Add(institution);
        await dbContext.SaveChangesAsync();

        return Results.Created($"/institutions/{institution.Id}", ToResponse(institution));
    }

    private static async Task<IResult> GetInstitutionByIdAsync(
        Guid id,
        ClaimsPrincipal user,
        ApplicationDbContext dbContext)
    {
        var query = dbContext.Institutions.AsQueryable();

        if (user.IsInRole(Roles.InstitutionAdmin))
        {
            var institutionId = user.FindFirstValue("institution_id");
            query = query.Where(i => i.Id.ToString() == institutionId);
        }

        var institution = await query.FirstOrDefaultAsync(i => i.Id == id);

        if (institution is null)
        {
            return Results.NotFound();
        }

        return Results.Ok(ToResponse(institution));
    }

    private static InstitutionResponse ToResponse(Institution institution) =>
        new(
            institution.Id,
            institution.Nombre,
            institution.CUIT,
            institution.RazonSocial,
            institution.CondicionIVA,
            institution.Email,
            institution.Telefono,
            institution.Direccion,
            institution.Banco,
            institution.CBU,
            institution.AliasCBU,
            institution.EsProfesionalIndependiente,
            institution.Activa);
}
