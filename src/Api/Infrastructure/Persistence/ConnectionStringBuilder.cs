namespace VitalMinds.Clinic.Api.Infrastructure.Persistence;

public static class ConnectionStringBuilder
{
    public static string Build(IConfiguration configuration)
    {
        var directConnectionString = configuration["POSTGRES_CONNECTION_STRING"];
        if (!string.IsNullOrWhiteSpace(directConnectionString))
        {
            return directConnectionString;
        }

        var host = configuration["POSTGRES_HOST"] ?? "localhost";
        var port = configuration["POSTGRES_PORT"] ?? "5432";
        var database = configuration["POSTGRES_DB"] ?? "vitalminds";
        var user = configuration["POSTGRES_USER"] ?? "postgres";
        var password = configuration["POSTGRES_PASSWORD"] ?? "postgres";
        var sslMode = configuration["POSTGRES_SSL_MODE"];
        var trustServerCertificate = configuration["POSTGRES_TRUST_SERVER_CERTIFICATE"];
        var additionalArgs = configuration["POSTGRES_CONNECTION_ARGS"];

        var connectionString = $"Host={host};Port={port};Database={database};Username={user};Password={password}";

        if (!string.IsNullOrWhiteSpace(sslMode))
        {
            connectionString += $";Ssl Mode={sslMode}";
        }

        if (!string.IsNullOrWhiteSpace(trustServerCertificate))
        {
            connectionString += $";Trust Server Certificate={trustServerCertificate}";
        }

        if (!string.IsNullOrWhiteSpace(additionalArgs))
        {
            connectionString += $";{additionalArgs.Trim().TrimEnd(';')}";
        }

        return connectionString;
    }
}
