param(
  [string]$WebUrl = "https://app.getvibeshare.com",
  [string]$ApiUrl = "https://api.getvibeshare.com"
)

$ErrorActionPreference = "Stop"

function Write-Section($Text) {
  Write-Host ""
  Write-Host "== $Text ==" -ForegroundColor Cyan
}

function Assert-Equal($Label, $Actual, $Expected) {
  if ($Actual -ne $Expected) {
    throw "$Label expected '$Expected' but got '$Actual'."
  }
  Write-Host "[OK] $Label = $Actual" -ForegroundColor Green
}

function Assert-True($Label, $Value) {
  if (-not $Value) {
    throw "$Label failed."
  }
  Write-Host "[OK] $Label" -ForegroundColor Green
}

$healthUrl = "$ApiUrl/health"
$infoUrl = "$ApiUrl/api/info"

Write-Section "API health"
$health = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 20
Assert-True "health ok" $health.ok
Assert-Equal "health public web url" $health.publicUrls.webApp $WebUrl
Assert-Equal "health public api url" $health.publicUrls.api $ApiUrl
Assert-Equal "health storage driver" $health.activeDrivers.storage.active "s3"
Assert-Equal "health database driver" $health.activeDrivers.database.active "postgres"
Assert-Equal "health cache driver" $health.activeDrivers.cache.active "redis"
Assert-Equal "health realtime driver" $health.activeDrivers.realtime.active "redis"
Assert-Equal "health fallback warning count" @($health.fallbackWarnings).Count 0
Write-Host "[INFO] API mode reported by health: $($health.mode)" -ForegroundColor Yellow

Write-Section "API info"
$info = Invoke-RestMethod -Uri $infoUrl -Method Get -TimeoutSec 20
Assert-True "api/info ok" $info.ok
Assert-Equal "info public web url" $info.publicUrls.webApp $WebUrl
Assert-Equal "info public api url" $info.publicUrls.api $ApiUrl
Assert-Equal "info mobile server url" $info.mobileServerUrl $ApiUrl
Assert-Equal "info mobile web url" $info.mobileWebUrl $WebUrl
Assert-Equal "info validation error count" @($info.validation.errors).Count 0
Assert-Equal "info validation warning count" @($info.validation.warnings).Count 0
Write-Host "[INFO] API mode reported by info: $($info.mode)" -ForegroundColor Yellow

Write-Section "Web app"
$response = Invoke-WebRequest -Uri $WebUrl -Method Head -TimeoutSec 20
if ([int]$response.StatusCode -lt 200 -or [int]$response.StatusCode -gt 399) {
  throw "Web app returned HTTP $($response.StatusCode)."
}
Write-Host "[OK] web app HTTP $($response.StatusCode)" -ForegroundColor Green

Write-Section "Result"
Write-Host "Public operation check passed." -ForegroundColor Green
