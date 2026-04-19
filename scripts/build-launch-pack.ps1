$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Deliverables = Join-Path $Root "deliverables"
$PackRoot = Join-Path $Deliverables "launch-ready"
$ZipPath = Join-Path $Deliverables "vibe-share-launch-ready.zip"

function Copy-Path($Source, $Destination) {
  if (Test-Path $Source) {
    Copy-Item -LiteralPath $Source -Destination $Destination -Recurse -Force
  }
}

Set-Location -LiteralPath $Root
New-Item -ItemType Directory -Force $Deliverables | Out-Null

$resolvedDeliverables = (Resolve-Path $Deliverables).Path
if (Test-Path $PackRoot) {
  $resolvedPack = (Resolve-Path $PackRoot).Path
  if (-not $resolvedPack.StartsWith($resolvedDeliverables, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to remove unexpected path: $resolvedPack"
  }
  Remove-Item -LiteralPath $PackRoot -Recurse -Force
}

New-Item -ItemType Directory -Force $PackRoot | Out-Null

Copy-Path (Join-Path $Root "README.md") $PackRoot
Copy-Path (Join-Path $Root "START_HERE_FIRST.md") $PackRoot
Copy-Path (Join-Path $Root "OWNER_ONLY_FINAL_STEPS.md") $PackRoot
Copy-Path (Join-Path $Root "BETA_OPERATOR_CHECKLIST.md") $PackRoot
Copy-Path (Join-Path $Root "IPHONE_TEST_STEPS.md") $PackRoot
Copy-Path (Join-Path $Root "LAUNCH_STATUS.md") $PackRoot
Copy-Path (Join-Path $Root "docs\site-map.md") $PackRoot
Copy-Path (Join-Path $Root "docs\launch") (Join-Path $PackRoot "launch")
Copy-Path (Join-Path $Root "docs\site") (Join-Path $PackRoot "site")
Copy-Path (Join-Path $Root ".codex") (Join-Path $PackRoot "codex-actions")
Copy-Path (Join-Path $Root "scripts") (Join-Path $PackRoot "scripts")
Copy-Path (Join-Path $Root ".env.example") $PackRoot
Copy-Path (Join-Path $Root ".env.production-like.example") $PackRoot

if (Test-Path $ZipPath) {
  Remove-Item -LiteralPath $ZipPath -Force
}
Compress-Archive -Path (Join-Path $PackRoot "*") -DestinationPath $ZipPath -Force

Write-Host "Launch-ready folder:" -ForegroundColor Green
Write-Host "  $PackRoot"
Write-Host "Launch-ready ZIP:" -ForegroundColor Green
Write-Host "  $ZipPath"
