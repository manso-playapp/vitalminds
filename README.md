# VitalMinds Clinic

Solución clínica para administrar el circuito completo de VitalMinds Clinic con control por roles, trazabilidad de episodios y generación de documentos.

## Requisitos previos
- .NET 8 SDK (para compilar la API)
- Node.js 20.x y pnpm (o npm) para el frontend
- Docker Desktop con `docker compose`

## Puesta en marcha rápida
```bash
cp .env.example .env
docker compose up -d
# En otra terminal
dotnet tool restore
dotnet ef database update --project src/Api
pnpm install --dir src/Web
pnpm dev --dir src/Web
```

Swagger disponible en `http://localhost:8080/swagger`.
Frontend en `http://localhost:5173`.

### Credenciales seed (desarrollo)
- Superadmin: `admin@vitalminds.local / Admin123!`
- Institución demo: `vital@institucion.local / Institucion123!`
- Psicólogo/a: `psico.demo@vitalminds.local / Psico123!`
- Médico/a: `medico.demo@vitalminds.local / Medico123!`
- Extraccionista: `extraccion@vitalminds.local / Extra123!`
- Laboratorio: `lab@vitalminds.local / Lab123!`

## Scripts útiles
- `dotnet test`
- `pnpm lint --dir src/Web`
- `docker compose down -v`

## Feature flags
- `WHATSAPP_STUB_ENABLED`: habilita el servicio simulado de WhatsApp (cambiar a `false` al integrar WhatsApp Business API).
- `FEATURE_HL7_FHIR_ENABLED`: prepara funciones futuras para intercambios HL7/FHIR con laboratorios.

## Estructura
```
src/
  Api/        # ASP.NET Core Web API (Minimal APIs + EF Core + Identity)
  Web/        # React 18 + Vite + Tailwind + TanStack Query
docs/
  VitalMinds.postman_collection.json
```

Los catálogos de tests y estudios se siembran en la primera migración. Cada documento clínico es inmutable y se registra en AuditLog todo cambio relevante.
