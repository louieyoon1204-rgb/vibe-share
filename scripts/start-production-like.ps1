param(
  [switch]$SkipInstall,
  [switch]$ResetInfra,
  [switch]$KeepExistingProcesses,
  [switch]$StartNativeMobile
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

function Write-Section($Text) {
  Write-Host ""
  Write-Host "== $Text ==" -ForegroundColor Cyan
}

function Test-PortListening($Port) {
  return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Stop-LocalDevProcesses {
  $targetPorts = @(4000, 5173, 8081)
  $portPids = @(Get-NetTCPConnection -LocalPort $targetPorts -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique)
  $escapedRoot = [regex]::Escape($Root)
  $devPids = @(Get-CimInstance Win32_Process | Where-Object {
      ($_.CommandLine -match $escapedRoot) -and
      ($_.CommandLine -match "vite|expo|apps/server/src/index|node --watch|npm.cmd|dev:web|dev:server|dev:mobile") -and
      ($_.Name -match "node|npm|cmd|powershell")
    } | Select-Object -ExpandProperty ProcessId)

  $allProcesses = @(Get-CimInstance Win32_Process)
  $queue = New-Object System.Collections.Generic.Queue[int]
  $stopIds = New-Object System.Collections.Generic.HashSet[int]
  foreach ($id in ($portPids + $devPids | Where-Object { $_ } | Select-Object -Unique)) {
    [void]$stopIds.Add([int]$id)
    $queue.Enqueue([int]$id)
  }
  while ($queue.Count -gt 0) {
    $current = $queue.Dequeue()
    foreach ($child in $allProcesses | Where-Object { $_.ParentProcessId -eq $current }) {
      if ($stopIds.Add([int]$child.ProcessId)) {
        $queue.Enqueue([int]$child.ProcessId)
      }
    }
  }
  foreach ($id in (@($stopIds) | Sort-Object -Descending)) {
    if ($id -eq $PID) { continue }
    Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
  }
}

function Wait-HttpOk($Url, $Seconds) {
  $deadline = (Get-Date).AddSeconds($Seconds)
  while ((Get-Date) -lt $deadline) {
    try {
      & curl.exe --silent --show-error --fail --max-time 2 $Url *> $null
      if ($LASTEXITCODE -eq 0) {
        return
      }
    } catch {
      # Keep waiting while the service starts.
    }
    Start-Sleep -Milliseconds 500
  }
  throw "Timed out waiting for $Url"
}

function Invoke-DbMigrateWithRetry {
  for ($attempt = 1; $attempt -le 8; $attempt++) {
    & npm.cmd run db:migrate
    if ($LASTEXITCODE -eq 0) {
      return
    }
    Write-Host "Database migration attempt $attempt failed; waiting for local Postgres to settle..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
  }
  throw "db migration failed."
}

function Start-DevWindow($Title, $Command, $LogName) {
  $escapedRoot = $Root.Replace("'", "''")
  $escapedTitle = $Title.Replace("'", "''")
  $logPath = Join-Path $Root ".tmp\$LogName"
  $escapedLogPath = $logPath.Replace("'", "''")
  New-Item -ItemType Directory -Force (Join-Path $Root ".tmp") | Out-Null
  Remove-Item -LiteralPath $logPath -Force -ErrorAction SilentlyContinue
  $fullCommand = "Set-Location -LiteralPath '$escapedRoot'; `$host.UI.RawUI.WindowTitle = '$escapedTitle'; $Command 2>&1 | Tee-Object -FilePath '$escapedLogPath'"
  Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $fullCommand | Out-Null
}

Set-Location -LiteralPath $Root

Write-Section "Vibe Share production-like local mode"
Write-Host "This mode uses Docker Desktop for PostgreSQL, Redis, and MinIO."
Write-Host "You do not need administrator PowerShell unless Docker Desktop itself is broken or not initialized."

if (-not $KeepExistingProcesses) {
  Write-Section "Cleaning old local processes"
  Stop-LocalDevProcesses
  Write-Host "Cleared ports 4000, 5173, and 8081 if old dev processes were using them."
}

if (-not $SkipInstall -and -not (Test-Path (Join-Path $Root "node_modules"))) {
  Write-Section "Installing dependencies"
  & npm.cmd install
  if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
}

Write-Section "Checking Docker"
try {
  & docker info *> $null
  if ($LASTEXITCODE -ne 0) { throw "docker info failed" }
} catch {
  Write-Host "Docker Engine is not ready." -ForegroundColor Red
  Write-Host "Smallest user action: open Docker Desktop once. If it still fails, open PowerShell as Administrator and run:"
  Write-Host "  Set-ExecutionPolicy -Scope Process Bypass -Force"
  Write-Host "  .\scripts\repair-wsl-docker.ps1"
  exit 1
}

Write-Section "Starting local infrastructure"
if ($ResetInfra) {
  & docker compose -f docker-compose.local-infra.yml down
  if ($LASTEXITCODE -ne 0) { throw "docker compose down failed." }
}
& docker compose -f docker-compose.local-infra.yml up -d
if ($LASTEXITCODE -ne 0) { throw "docker compose failed." }

Write-Section "Running database migration"
Invoke-DbMigrateWithRetry

Write-Section "Starting app services"
if (Test-PortListening 4000) {
  Write-Host "Server already appears to be running on http://localhost:4000" -ForegroundColor Yellow
} else {
  Start-DevWindow "Vibe Share server" "npm.cmd run dev:server" "production-like-server.log"
  Write-Host "Opened server window."
}
Wait-HttpOk "http://localhost:4000/health" 120
Write-Host "Server health check OK."

if (Test-PortListening 5173) {
  Write-Host "Web app already appears to be running on http://localhost:5173" -ForegroundColor Yellow
} else {
  Start-DevWindow "Vibe Share web app" "npm.cmd run dev:web" "production-like-web.log"
  Write-Host "Opened web app window."
}
Wait-HttpOk "http://localhost:5173" 120
Write-Host "Web app check OK."

if ($StartNativeMobile) {
  if (Test-PortListening 8081) {
    Write-Host "Expo dev server already appears to be running on http://localhost:8081" -ForegroundColor Yellow
  } else {
    Start-DevWindow "Vibe Share mobile Expo" "npm.cmd run dev:mobile" "production-like-mobile.log"
    Write-Host "Opened Expo mobile window."
  }
}

Write-Section "Operator checks"
Write-Host "After the server window says it started, run:"
Write-Host "  curl.exe http://localhost:4000/health"
Write-Host "  curl.exe http://localhost:4000/admin/status"
Write-Host "  curl.exe http://localhost:5173"
Write-Host "Expected: active drivers postgres/redis/redis/s3 and fallbackWarnings empty."
