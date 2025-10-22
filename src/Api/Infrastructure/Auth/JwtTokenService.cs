namespace VitalMinds.Clinic.Api.Infrastructure.Auth;

public class JwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(ApplicationUser user, IList<string> roles)
    {
        var issuer = _configuration["JWT_ISSUER"] ?? "vitalminds";
        var audience = _configuration["JWT_AUDIENCE"] ?? "vitalminds-api";
        var secret = _configuration["JWT_SECRET"] ?? throw new InvalidOperationException("JWT_SECRET no configurado");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, $"{user.Nombre} {user.Apellido}"),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new("role", user.Rol)
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        if (user.InstitutionId.HasValue)
        {
            claims.Add(new Claim("institution_id", user.InstitutionId.Value.ToString()));
        }

        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
