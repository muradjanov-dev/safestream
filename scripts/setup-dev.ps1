# SafeStream — Dev Environment Setup
# Usage: .\scripts\setup-dev.ps1

Write-Host "=== SafeStream Dev Setup ===" -ForegroundColor Cyan

# 1. Check prerequisites
foreach ($cmd in @("node", "pnpm", "docker", "docker-compose")) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Error "$cmd is required but not installed."
        exit 1
    }
}
Write-Host "Prerequisites OK" -ForegroundColor Green

# 2. Install dependencies
Write-Host "Installing dependencies..."
pnpm install

# 3. Copy env file
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host ".env created from .env.example — update values before starting" -ForegroundColor Yellow
}

# 4. Start infrastructure
Write-Host "Starting Docker services..."
docker compose -f docker-compose.dev.yml up -d postgres redis rabbitmq elasticsearch minio

# 5. Wait for postgres
Write-Host "Waiting for PostgreSQL..."
$retries = 30
for ($i = 0; $i -lt $retries; $i++) {
    $result = docker exec safestream-postgres pg_isready -U safestream 2>&1
    if ($LASTEXITCODE -eq 0) { break }
    Start-Sleep -Seconds 2
}

# 6. Run migrations
Write-Host "Running database migrations..."
docker exec -i safestream-postgres psql -U safestream -d safestream `
  -f /docker-entrypoint-initdb.d/001_initial_schema.sql

Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host "Services:"
Write-Host "  PostgreSQL:     localhost:5432"
Write-Host "  Redis:          localhost:6379"
Write-Host "  RabbitMQ UI:    http://localhost:15672  (safestream/safestream)"
Write-Host "  MinIO Console:  http://localhost:9001   (safestream/safestream123)"
Write-Host "  Elasticsearch:  http://localhost:9200"
Write-Host ""
Write-Host "To start all services: docker compose -f docker-compose.dev.yml up"
Write-Host "To start web dev:      pnpm --filter @safestream/web dev"
