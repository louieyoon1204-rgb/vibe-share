$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

function Write-Section($Text) {
  Write-Host ""
  Write-Host "== $Text ==" -ForegroundColor Cyan
}

function Assert-File($RelativePath) {
  $path = Join-Path $Root $RelativePath
  if (-not (Test-Path -LiteralPath $path)) {
    throw "Missing required file: $RelativePath"
  }
  Write-Host "[OK] $RelativePath" -ForegroundColor Green
}

function Assert-GitIgnored($RelativePath) {
  & git -C $Root check-ignore -q -- $RelativePath
  if ($LASTEXITCODE -ne 0) {
    throw "$RelativePath is not ignored by git."
  }
  Write-Host "[OK] ignored: $RelativePath" -ForegroundColor Green
}

Set-Location -LiteralPath $Root

Write-Section "Git repository"
& git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) {
  throw "This folder is not a git repository yet. Run: git init -b main"
}
Write-Host "[OK] git repository detected" -ForegroundColor Green

Write-Section "Required GitHub/Railway files"
foreach ($file in @(
  ".gitignore",
  ".gitattributes",
  "package.json",
  "package-lock.json",
  "README.md",
  "START_HERE_FIRST.md",
  ".env.example",
  ".env.staging.example",
  "railway.toml",
  "apps\server\package.json",
  "apps\server\src\index.js",
  "packages\shared\package.json",
  "docs\launch\railway-api-service.md",
  "GITHUB_UPLOAD_CHECKLIST.md"
)) {
  Assert-File $file
}

Write-Section "Ignored local-only paths"
foreach ($path in @(
  ".env",
  ".tmp",
  ".codex",
  "deliverables",
  "node_modules",
  "apps/mobile/node_modules"
)) {
  Assert-GitIgnored $path
}

Write-Section "Candidate files for commit"
$files = @(& git -C $Root ls-files -co --exclude-standard)
$blocked = @($files | Where-Object {
    $_ -match '(^|/)(node_modules|\.tmp|\.codex|deliverables)(/|$)' -or
    $_ -match '(^|/)\.env($|[.])'
  } | Where-Object {
    $_ -notmatch '^\.env\.example$' -and
    $_ -notmatch '^\.env\.production-like\.example$' -and
    $_ -notmatch '^\.env\.staging\.example$'
  })

if ($blocked.Count -gt 0) {
  $blocked | ForEach-Object { Write-Host "blocked candidate: $_" -ForegroundColor Red }
  throw "Git commit candidates include local-only files."
}
Write-Host "[OK] no local env/generated folders in commit candidates" -ForegroundColor Green

Write-Section "Basic secret scan"
$secretPattern = '(?i)(BEGIN (RSA |OPENSSH |EC |DSA )?PRIVATE KEY|github_pat_|ghp_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{20,}|xox[baprs]-|AKIA[0-9A-Z]{16}|aws_secret_access_key\s*=)'
$hits = @()
foreach ($file in @($files | Where-Object { $_ -ne "scripts/github-readiness.ps1" })) {
  $fullPath = Join-Path $Root $file
  if ((Test-Path -LiteralPath $fullPath -PathType Leaf) -and ((Get-Item -LiteralPath $fullPath).Length -lt 2MB)) {
    $matches = @(Select-String -LiteralPath $fullPath -Pattern $secretPattern -AllMatches -ErrorAction SilentlyContinue)
    foreach ($match in $matches) {
      $hits += "${file}:$($match.LineNumber)"
    }
  }
}

if ($hits.Count -gt 0) {
  $hits | ForEach-Object { Write-Host "possible secret: $_" -ForegroundColor Red }
  throw "Possible secrets found in commit candidates."
}
Write-Host "[OK] no obvious secret patterns found" -ForegroundColor Green

Write-Section "Railway API service"
Write-Host "[OK] Use repo root as the Railway source, with railway.toml starting only apps/server." -ForegroundColor Green
Write-Host "[OK] Do not set Railway Root Directory to /apps/server because packages/shared is a workspace dependency." -ForegroundColor Green

Write-Section "Result"
Write-Host "GitHub upload readiness checks passed." -ForegroundColor Green
Write-Host "Next: git add . && git commit -m ""beta stable staging-ready baseline"""
