$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$TempServer = $null
$TempServerOut = Join-Path $Root ".tmp\full-check-server.out.log"
$TempServerErr = Join-Path $Root ".tmp\full-check-server.err.log"

function Write-Section($Text) {
  Write-Host ""
  Write-Host "== $Text ==" -ForegroundColor Cyan
}

function Invoke-Native($Label, $Exe, [string[]]$Arguments) {
  Write-Section $Label
  & $Exe @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Label failed with exit code $LASTEXITCODE."
  }
}

function Invoke-NativeWithRetry($Label, $Exe, [string[]]$Arguments, [int]$Attempts = 8) {
  Write-Section $Label
  for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
    & $Exe @Arguments
    if ($LASTEXITCODE -eq 0) {
      return
    }
    Write-Host "$Label attempt $attempt failed; waiting before retry..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
  }
  throw "$Label failed after $Attempts attempts."
}

function Test-Health {
  try {
    & curl.exe --silent --show-error --fail --max-time 3 "http://localhost:4000/health" *> $null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  }
}

function Wait-Health {
  for ($i = 0; $i -lt 80; $i++) {
    if (Test-Health) { return }
    Start-Sleep -Milliseconds 500
  }
  throw "Server did not become healthy at http://localhost:4000/health."
}

try {
  Set-Location -LiteralPath $Root
  New-Item -ItemType Directory -Force .tmp | Out-Null

  Invoke-Native "npm install" "npm.cmd" @("install")
  Invoke-Native "npm test" "npm.cmd" @("test")
  Invoke-Native "integration smoke" "npm.cmd" @("run", "smoke:integration")
  Invoke-Native "MinIO smoke" "npm.cmd" @("run", "smoke:minio")
  Invoke-Native "cleanup" "npm.cmd" @("run", "cleanup")
  Invoke-Native "web build" "npm.cmd" @("run", "build", "-w", "apps/web")
  Invoke-Native "mobile iOS export" "npm.cmd" @("exec", "-w", "apps/mobile", "--", "expo", "export", "--platform", "ios", "--output-dir", "../../.tmp/expo-export-ios")
  Invoke-Native "docker compose local infra" "docker" @("compose", "-f", "docker-compose.local-infra.yml", "up", "-d")
  Invoke-NativeWithRetry "db migrate" "npm.cmd" @("run", "db:migrate")

  if (-not (Test-Health)) {
    Write-Section "starting temporary server for curl checks"
    Remove-Item $TempServerOut, $TempServerErr -ErrorAction SilentlyContinue
    $TempServer = Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList "apps/server/src/index.js" -WorkingDirectory $Root -PassThru -RedirectStandardOutput $TempServerOut -RedirectStandardError $TempServerErr
    Wait-Health
  }

  Invoke-Native "curl /" "curl.exe" @("http://localhost:4000/")
  Invoke-Native "curl /health" "curl.exe" @("http://localhost:4000/health")
  Invoke-Native "curl /admin/health" "curl.exe" @("http://localhost:4000/admin/health")
  Invoke-Native "curl /admin/status" "curl.exe" @("http://localhost:4000/admin/status")
  Invoke-Native "curl /api/info" "curl.exe" @("http://localhost:4000/api/info")

  Write-Section "production-like configured driver smoke"
  $env:INTEGRATION_USE_CONFIG_DRIVERS = "true"
  & npm.cmd run smoke:integration
  if ($LASTEXITCODE -ne 0) {
    throw "Configured driver integration smoke failed with exit code $LASTEXITCODE."
  }
  Remove-Item Env:\INTEGRATION_USE_CONFIG_DRIVERS -ErrorAction SilentlyContinue

  Write-Section "full check complete"
  Write-Host "All requested verification steps passed." -ForegroundColor Green
} finally {
  Remove-Item Env:\INTEGRATION_USE_CONFIG_DRIVERS -ErrorAction SilentlyContinue
  if ($TempServer -and -not $TempServer.HasExited) {
    Stop-Process -Id $TempServer.Id -Force -ErrorAction SilentlyContinue
  }
}
