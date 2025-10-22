FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && curl -sSf https://render.com/static/postgres-ca.crt -o /usr/local/share/ca-certificates/render-ca.crt \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/Api/VitalMinds.Clinic.Api.csproj", "Api/"]
RUN dotnet restore "Api/VitalMinds.Clinic.Api.csproj"
COPY src/Api/ Api/
WORKDIR /src/Api
RUN dotnet publish "VitalMinds.Clinic.Api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "VitalMinds.Clinic.Api.dll"]
