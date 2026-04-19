$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

function Write-Section($Text) {
  Write-Host ""
  Write-Host "== $Text ==" -ForegroundColor Cyan
}

function Invoke-Step($Label, $Exe, [string[]]$Arguments) {
  Write-Section $Label
  & $Exe @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Label failed with exit code $LASTEXITCODE."
  }
}

function Assert-File($RelativePath) {
  $path = Join-Path $Root $RelativePath
  if (-not (Test-Path -LiteralPath $path)) {
    throw "Missing required file: $RelativePath"
  }
  Write-Host "[OK] $RelativePath" -ForegroundColor Green
}

function Assert-EnvTemplateKey($Key) {
  if ($script:StagingEnv -notmatch "(?m)^$([regex]::Escape($Key))=") {
    throw ".env.staging.example is missing $Key"
  }
  Write-Host "[OK] $Key" -ForegroundColor Green
}

Set-Location -LiteralPath $Root

Write-Section "Required staging files"
Assert-File ".env.staging.example"
Assert-File "BETA_STABLE_STATUS.md"
Assert-File "docs\deployment.md"
Assert-File "docs\launch\staging-handoff.md"
Assert-File "docs\launch\staging-deploy-checklist.md"
Assert-File "scripts\check-local-network.ps1"

Write-Section "Staging environment template"
$script:StagingEnv = Get-Content -Raw (Join-Path $Root ".env.staging.example")
foreach ($key in @(
  "APP_MODE",
  "CORS_ORIGIN",
  "DATABASE_DRIVER",
  "CACHE_DRIVER",
  "SOCKET_IO_ADAPTER",
  "STORAGE_DRIVER",
  "DATABASE_URL",
  "REDIS_URL",
  "S3_ENDPOINT",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "DEVICE_TRUST_SECRET",
  "ADMIN_TOKEN",
  "AUTH_JWT_SECRET",
  "REQUIRE_DEVICE_TRUST",
  "VITE_SERVER_URL",
  "PUBLIC_SITE_URL",
  "PUBLIC_WEB_APP_URL",
  "PUBLIC_API_URL",
  "EXPO_PUBLIC_SERVER_URL"
)) {
  Assert-EnvTemplateKey $key
}

Invoke-Step "npm install" "npm.cmd" @("install")
Invoke-Step "npm test" "npm.cmd" @("test")
Invoke-Step "MinIO smoke" "npm.cmd" @("run", "smoke:minio")
Invoke-Step "web build" "npm.cmd" @("run", "build", "-w", "apps/web")
Invoke-Step "local network check" "powershell" @("-ExecutionPolicy", "Bypass", "-File", "scripts\check-local-network.ps1")

Write-Section "Staging readiness result"
Write-Host "Local beta stable gate passed." -ForegroundColor Green
Write-Host "Next external step: create staging DNS, hosting, PostgreSQL, Redis, S3, TLS, and secrets."
Write-Host "Then follow docs\launch\staging-deploy-checklist.md."
