namespace VitalMinds.Clinic.Api.Infrastructure.Persistence;

public static class ConnectionStringBuilder
{
    public static string Build(IConfiguration configuration)
    {
        var host = configuration["POSTGRES_HOST"] ?? "localhost";
        var port = configuration["POSTGRES_PORT"] ?? "5432";
        var database = configuration["POSTGRES_DB"] ?? "vitalminds";
        var user = configuration["POSTGRES_USER"] ?? "postgres";
        var password = configuration["POSTGRES_PASSWORD"] ?? "postgres";

        return $"Host={host};Port={port};Database={database};Username={user};Password={password}";
    }
}
