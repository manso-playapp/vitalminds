namespace VitalMinds.Clinic.Api.Infrastructure.Seed;

public class SeedDataService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SeedDataService> _logger;

    public SeedDataService(
        ApplicationDbContext dbContext,
        RoleManager<IdentityRole> roleManager,
        UserManager<ApplicationUser> userManager,
        IConfiguration configuration,
        ILogger<SeedDataService> logger)
    {
        _dbContext = dbContext;
        _roleManager = roleManager;
        _userManager = userManager;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task ApplyMigrationsAsync()
    {
        await _dbContext.Database.MigrateAsync();
    }

    public async Task SeedAsync()
    {
        await EnsureRolesAsync();
        await EnsureDefaultUsersAsync();
        await EnsureTestCatalogAsync();
        await EnsureDefaultParametersAsync();
    }

    private async Task EnsureRolesAsync()
    {
        foreach (var role in Roles.All)
        {
            if (!await _roleManager.RoleExistsAsync(role))
            {
                await _roleManager.CreateAsync(new IdentityRole(role));
            }
        }
    }

    private async Task EnsureDefaultUsersAsync()
    {
        var superadminEmail = "admin@vitalminds.local";
        var superadmin = await _userManager.FindByEmailAsync(superadminEmail);
        if (superadmin == null)
        {
            superadmin = new ApplicationUser
            {
                UserName = superadminEmail,
                Email = superadminEmail,
                EmailConfirmed = true,
                Nombre = "Vital",
                Apellido = "Admin",
                Rol = Roles.Superadmin
            };
            await _userManager.CreateAsync(superadmin, "Admin123!");
            await _userManager.AddToRoleAsync(superadmin, Roles.Superadmin);
        }

        var institution = await _dbContext.Institutions.FirstOrDefaultAsync();
        if (institution == null)
        {
            institution = new Institution
            {
                Nombre = "VitalMinds Demo",
                CUIT = "30-12345678-9",
                RazonSocial = "VitalMinds Demo S.A.",
                CondicionIVA = "Responsable Inscripto",
                Email = "contacto@vitalminds.local",
                Telefono = "+54 11 5555-0000",
                Direccion = "Av. Siempreviva 123, Buenos Aires",
                Banco = "Banco Demo",
                CBU = "2850590940090412345672",
                AliasCBU = "vitalminds.demo",
                EsProfesionalIndependiente = false,
                Activa = true
            };
            _dbContext.Institutions.Add(institution);
            await _dbContext.SaveChangesAsync();
        }

        await CreateUserIfNotExistsAsync("vital@institucion.local", "Institucion123!", "Valentina", "Gestora", Roles.InstitutionAdmin, institution.Id);
        await CreateUserIfNotExistsAsync("psico.demo@vitalminds.local", "Psico123!", "Pablo", "Psicologo", Roles.Psychologist, institution.Id, "Psicología Clínica", "MP-12345", "+54 9 11 5555-0101");
        await CreateUserIfNotExistsAsync("medico.demo@vitalminds.local", "Medico123!", "Maria", "Medica", Roles.Physician, institution.Id, "Medicina Clínica", "MN-54321", "+54 9 11 5555-0202");
        await CreateUserIfNotExistsAsync("extraccion@vitalminds.local", "Extra123!", "Ernesto", "Extraccionista", Roles.Phlebotomist, institution.Id, "Extraccionista", "EXT-0001", "+54 9 11 5555-0303");
        await CreateUserIfNotExistsAsync("lab@vitalminds.local", "Lab12345!", "Laura", "Laboratorio", Roles.Laboratory, institution.Id, "Bioquímica", "LAB-9999", "+54 9 11 5555-0404");
    }

    private async Task EnsureTestCatalogAsync()
    {
        if (await _dbContext.TestCatalogs.AnyAsync())
        {
            return;
        }

        var tests = new List<TestCatalog>
        {
            new() { Nombre = "DASS-21", Version = "1.0", Descripcion = "Depression Anxiety Stress Scales" },
            new() { Nombre = "PSS-10", Version = "1.0", Descripcion = "Perceived Stress Scale" },
            new() { Nombre = "STAI", Version = "1.0", Descripcion = "State-Trait Anxiety Inventory" },
            new() { Nombre = "BDI-II", Version = "1.0", Descripcion = "Beck Depression Inventory" },
            new() { Nombre = "MBI", Version = "1.0", Descripcion = "Maslach Burnout Inventory" }
        };

        await _dbContext.TestCatalogs.AddRangeAsync(tests);
        await _dbContext.SaveChangesAsync();
    }

    private async Task EnsureDefaultParametersAsync()
    {
        var institution = await _dbContext.Institutions.Include(i => i.Parameters).FirstOrDefaultAsync();
        if (institution == null)
        {
            return;
        }

        if (institution.Parameters != null)
        {
            return;
        }

        institution.Parameters = new Parameters
        {
            InstitutionId = institution.Id,
            TestsHabilitados = new Dictionary<string, object>
            {
                { "activos", new[] { "DASS-21", "PSS-10", "STAI", "BDI-II", "MBI" } },
                {
                    "config_bypass", new Dictionary<string, object>
                    {
                        { "rule_mode", "AND" },
                        {
                            "tests", new[]
                            {
                                new Dictionary<string, object> { { "code", "DASS21_TOTAL" }, { "operator", "<=" }, { "threshold", 40 }, { "optional", false } },
                                new Dictionary<string, object> { { "code", "PSS10_TOTAL" }, { "operator", "<=" }, { "threshold", 19 }, { "optional", false } },
                                new Dictionary<string, object> { { "code", "STAI_STATE" }, { "operator", "<=" }, { "threshold", 39 }, { "optional", true } }
                            }
                        }
                    }
                }
            },
            CatalogoEstudios = new Dictionary<string, object>
            {
                {
                    "items", new[]
                    {
                        CatalogoItem("660695", "Noradrenalina", "AltaComplejidad", 55000m, false),
                        CatalogoItem("660009", "Adrenalina", "AltaComplejidad", 52000m, false),
                        CatalogoItem("660189", "Cortisol por horario", "Comun", 21000m, false),
                        CatalogoItem("660865", "TSH", "Comun", 18000m, false),
                        CatalogoItem("660867", "T4 Libre", "Comun", 19500m, false),
                        CatalogoItem("660835", "Serotonina Plasmática", "AltaComplejidad", 48000m, false),
                        CatalogoItem("SER-PLA", "Serotonina Plaquetaria", "AltaComplejidad", 65000m, true),
                        CatalogoItem("ACIDO-GLU", "Ácido Glutámico", "AltaComplejidad", 70000m, true)
                    }
                }
            },
            SLAs = new Dictionary<string, object>
            {
                { "psicologia_a_medico_horas", 48 },
                { "pedido_a_extraccion_horas", 72 },
                { "extraccion_a_resultados_dias", 5 }
            },
            Plantillas = new Dictionary<string, object>
            {
                { "email_propuesta", DefaultEmailTemplate() },
                { "whatsapp_propuesta", DefaultWhatsAppTemplate() },
                { "informe_integrado", "Plantilla informe base v1" }
            }
        };

        await _dbContext.SaveChangesAsync();
    }

    private async Task CreateUserIfNotExistsAsync(
        string email,
        string password,
        string nombre,
        string apellido,
        string rol,
        Guid institutionId,
        string? especialidad = null,
        string? matricula = null,
        string? telefono = null,
        string? direccion = null)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user != null)
        {
            return;
        }

        Professional? professional = null;
        var rolEsProfesional = rol is Roles.Psychologist or Roles.Physician or Roles.Phlebotomist or Roles.Laboratory;

        if (rolEsProfesional)
        {
            professional = await EnsureProfessionalAsync(
                email,
                nombre,
                apellido,
                especialidad ?? "Profesional de la salud",
                matricula ?? $"TMP-{Guid.NewGuid():N}"[..8],
                telefono ?? "+54 9 11 5555-0000",
                direccion,
                institutionId);
        }

        user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            Nombre = nombre,
            Apellido = apellido,
            Rol = rol,
            InstitutionId = rolEsProfesional ? null : institutionId,
            ProfessionalId = professional?.Id
        };

        var result = await _userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            _logger.LogError("Error creando usuario seed {Email}: {Errors}", email, string.Join(",", result.Errors.Select(e => e.Description)));
            return;
        }

        await _userManager.AddToRoleAsync(user, rol);

        if (professional != null && professional.UserId == null)
        {
            professional.UserId = user.Id;
            await _dbContext.SaveChangesAsync();
        }
    }

    private async Task<Professional> EnsureProfessionalAsync(
        string email,
        string nombre,
        string apellido,
        string especialidad,
        string matricula,
        string telefono,
        string? direccion,
        Guid institutionId)
    {
        var professional = await _dbContext.Professionals
            .Include(p => p.Instituciones)
            .FirstOrDefaultAsync(p => p.Email == email || p.Matricula == matricula);

        if (professional is null)
        {
            professional = new Professional
            {
                Nombre = nombre,
                Apellido = apellido,
                Email = email,
                Especialidad = especialidad,
                Matricula = matricula,
                Telefono = telefono,
                Direccion = direccion,
                FechaAlta = DateOnly.FromDateTime(DateTime.UtcNow)
            };
            _dbContext.Professionals.Add(professional);
            await _dbContext.SaveChangesAsync();
        }

        var relacion = professional.Instituciones.FirstOrDefault(ip => ip.InstitutionId == institutionId);
        if (relacion is null)
        {
            professional.Instituciones.Add(new InstitutionProfessional
            {
                InstitutionId = institutionId,
                ProfessionalId = professional.Id,
                FechaAlta = DateOnly.FromDateTime(DateTime.UtcNow),
                Rol = "Profesional"
            });
            await _dbContext.SaveChangesAsync();
        }

        return professional;
    }

    private static Dictionary<string, object> CatalogoItem(string codigo, string nombre, string complejidad, decimal valorArs, bool requiereAutorizacion)
    {
        return new Dictionary<string, object>
        {
            { "codigo", codigo },
            { "nombre", nombre },
            { "complejidad", complejidad },
            { "valorArs", valorArs },
            { "requiereAutorizacion", requiereAutorizacion }
        };
    }

    private static Dictionary<string, object> DefaultEmailTemplate()
    {
        return new Dictionary<string, object>
        {
            { "subject", "{institution_name} • Tu propuesta personalizada de bienestar VitalMinds" },
            { "body", @"Hola {patient_first_name},

Completamos tu recorrido en el Departamento de Medicina del Estrés de {institution_name}.
En base a tu perfil actual, te proponemos avanzar con: {proposal_type}.

¿Por qué ahora?
• Es una intervención alineada a tus resultados.
• Podés iniciarla cuando quieras, con acompañamiento profesional.
• Impacta en regulación emocional y hábitos de bienestar.

Conocé los detalles y próximos pasos:
{proposal_link}

Si preferís, te enviamos un recordatorio por WhatsApp.

Gracias por confiar en VitalMinds.
Equipo VitalMinds Clinic" }
        };
    }

    private static Dictionary<string, object> DefaultWhatsAppTemplate()
    {
        return new Dictionary<string, object>
        {
            { "message", "Hola {patient_first_name} 👋 Desde {institution_name} ya tenemos tu propuesta VitalMinds lista: {proposal_type}. Ver detalles y confirmar 👉 {proposal_link}" }
        };
    }
}
