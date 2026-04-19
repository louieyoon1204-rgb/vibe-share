param(
  [switch]$Open
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Set-Location -LiteralPath $Root

$files = @(
  "START_HERE_FIRST.md",
  "BETA_OPERATOR_CHECKLIST.md",
  "IPHONE_TEST_STEPS.md",
  "LAUNCH_STATUS.md",
  "OWNER_ONLY_FINAL_STEPS.md",
  "docs\launch\mobile-build-handoff.md",
  "docs\launch\staging-handoff.md",
  "docs\site-map.md",
  "docs\launch\release-checklist.md"
)

Write-Host ""
Write-Host "Vibe Share operator summary" -ForegroundColor Cyan
Write-Host "Read in this order:"
foreach ($file in $files) {
  $path = Join-Path $Root $file
  Write-Host "  $path"
}

Write-Host ""
Write-Host "Most common commands:"
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\start-demo.ps1"
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\start-production-like.ps1"
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\run-full-check.ps1"
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\build-launch-pack.ps1"
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\build-final-release-pack.ps1"

if ($Open) {
  foreach ($file in $files) {
    $path = Join-Path $Root $file
    if (Test-Path $path) {
      Start-Process notepad.exe -ArgumentList $path | Out-Null
    }
  }
}
