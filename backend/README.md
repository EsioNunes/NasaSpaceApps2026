# Proxima Safra - MVP

Modular monolith in ASP.NET Core for comparing crop rotation strategies.
The ranking is deterministic.

## Requirements
- .NET 10 SDK

## Run locally
```bash
dotnet restore ProximaSafra.slnx
dotnet run --project src/ProximaSafra.Api
```

Use the file `src/ProximaSafra.Api/ProximaSafra.Api.http` or open `/openapi/v1.json`.

## Publish to Azure App Service (POC)

### 1) Prepare the infrastructure
```bash
az login
az account set --subscription "<SUBSCRIPTION_ID>"
```

### 2) Publish with Bicep + zip deploy
```powershell
powershell -ExecutionPolicy Bypass -File scripts/publish-azure.ps1 \
  -ResourceGroupName "rg-proximasafra-poc" \
  -Location "brazilsouth" \
  -AppServicePlanName "asp-proximasafra-poc" \
  -WebAppName "proximasafra-poc-<unique-suffix>"
```

The script creates the resource group, deploys the App Service on Linux with the .NET 10 runtime, publishes the API, and prints the final URL.

### 3) Validate
```bash
curl https://<webapp-name>.azurewebsites.net/health
```

### 4) POC limitations
- analysis data stays in memory;
- App Service restarts wipe saved analyses;
- the deployment is intentionally simple and does not include a database, authentication, or queues.

## Quick flow
1. `POST /api/analyses` creates and evaluates rotations using all cultures from the JSON catalog.
2. `GET /api/analyses/{id}` fetches the ranking.

## Projects
- **Domain**: entities, rules, and scoring engine.
- **Application**: use cases, DTOs, and contracts.
- **Infrastructure**: in-memory repositories, catalog, and template chat.
- **Api**: HTTP endpoints and dependency composition.
- **Tests**: scoring engine tests.

## Next steps
- PostgreSQL/PostGIS persistence.
- NASA environmental profile importer.
- Regionally validated crop catalog.
- Optional Azure OpenAI/OpenAI adapter.

## Catalog and rotation generation

Crops are stored in `src/ProximaSafra.Infrastructure/RotationCatalog.json`. Each culture includes its environmental attributes, cycle, thermal range, water demand, botanical family, and operational requirements.

The `cycleCount` field in `POST /api/analyses` defines how many cycles each rotation contains. The system generates combinations using all registered crops, allows repetition, and limits the value between 1 and 5 to avoid excessive growth in combination count.

`CurrentWeather` data continues to be obtained from the existing provider. The agronomic analysis uses data from NASA POWER. Each strategy receives a score, confidence, positive factors, risks, penalties, and discard reasons. Non-recommended strategies remain in the response to preserve explainability.
