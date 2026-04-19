param(
  [string]$ApiUrl = "https://api.getvibeshare.com",
  [string]$WebUrl = "https://app.getvibeshare.com",
  [string]$SiteUrl = "https://getvibeshare.com"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $Root

$env:VITE_SERVER_URL = $ApiUrl
$env:PUBLIC_API_URL = $ApiUrl
$env:PUBLIC_WEB_APP_URL = $WebUrl
$env:PUBLIC_SITE_URL = $SiteUrl
$env:VITE_BUILD_TIME = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

npm.cmd run build -w apps/web

Write-Host ""
Write-Host "Public web build ready: apps\web\dist" -ForegroundColor Green
Write-Host "Web: $WebUrl"
Write-Host "API: $ApiUrl"
