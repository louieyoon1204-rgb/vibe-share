param(
  [switch]$SkipDockerStart
)

$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Test-RebootPending {
  return (Test-Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending") -or
    (Test-Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired") -or
    $null -ne (Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager" -Name PendingFileRenameOperations -ErrorAction SilentlyContinue).PendingFileRenameOperations
}

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Run this script from an elevated PowerShell window: Start menu -> PowerShell -> Run as administrator."
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

Write-Step "Enable Windows WSL and Virtual Machine Platform features"
foreach ($feature in @("Microsoft-Windows-Subsystem-Linux", "VirtualMachinePlatform")) {
  $state = (Get-WindowsOptionalFeature -Online -FeatureName $feature).State
  if ($state -ne "Enabled") {
    Enable-WindowsOptionalFeature -Online -FeatureName $feature -All -NoRestart | Out-Host
  } else {
    Write-Host "$feature is already enabled"
  }
}

Write-Step "Ensure modern WSL package is installed"
$wslExe = "C:\Program Files\WSL\wsl.exe"
if (-not (Test-Path $wslExe)) {
  $downloadDir = Join-Path $repoRoot ".tmp\wsl-winget"
  New-Item -ItemType Directory -Force -Path $downloadDir | Out-Null
  winget download --id Microsoft.WSL -e --source winget --download-directory $downloadDir --accept-package-agreements --accept-source-agreements | Out-Host
  $msi = Get-ChildItem $downloadDir -Filter *.msi | Select-Object -First 1
  if (-not $msi) {
    throw "Could not find downloaded WSL MSI in $downloadDir"
  }
  $args = "/i `"$($msi.FullName)`" /qn /norestart"
  $process = Start-Process msiexec.exe -ArgumentList $args -Wait -PassThru
  if ($process.ExitCode -notin @(0, 3010)) {
    throw "WSL MSI install failed with exit code $($process.ExitCode)"
  }
}

& $wslExe --version | Out-Host
& $wslExe --install --no-distribution | Out-Host
& $wslExe --set-default-version 2 | Out-Host

if (Test-RebootPending) {
  Write-Warning "Windows reports a pending reboot. Reboot now, then rerun this script once."
  exit 3010
}

if (-not $SkipDockerStart) {
  Write-Step "Start Docker Desktop service and app"
  Start-Service -Name com.docker.service -ErrorAction Stop
  Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

  $env:Path = "C:\Program Files\Docker\Docker\resources\bin;C:\Program Files\WSL;$env:Path"
  for ($i = 1; $i -le 90; $i++) {
    docker desktop status 2>$null | Out-Host
    docker info --format "{{.ServerVersion}}" 2>$null
    if ($LASTEXITCODE -eq 0) {
      Write-Step "Docker Engine is ready"
      docker compose version
      exit 0
    }
    Start-Sleep -Seconds 2
  }

  throw "Docker Engine did not become ready. Open Docker Desktop, finish any first-run prompt, then rerun this script."
}

Write-Step "WSL repair finished"
