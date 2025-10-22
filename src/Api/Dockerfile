FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

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
