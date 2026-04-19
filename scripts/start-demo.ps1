param(
  [switch]$SkipInstall,
  [switch]$KeepExistingProcesses,
  [switch]$StartNativeMobile
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

function Write-Section($Text) {
  Write-Host ""
  Write-Host "== $Text ==" -ForegroundColor Cyan
}

function Get-PrimaryLanIp {
  $addresses = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -notlike "127.*" -and
      $_.IPAddress -notlike "169.254.*" -and
      $_.PrefixOrigin -ne "WellKnown" -and
      $_.InterfaceAlias -notmatch "vEthernet|WSL|Docker|Hyper-V|VirtualBox|VMware|Loopback"
    } |
    Sort-Object @{ Expression = { if ($_.IPAddress -like "192.168.*") { 0 } elseif ($_.IPAddress -like "10.*") { 1 } else { 2 } } }, IPAddress

  return ($addresses | Select-Object -First 1).IPAddress
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
      ($_.Name -match "node|npm|cmd")
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
    Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
  }
}

function Wait-HttpOk($Url, $Seconds) {
  $deadline = (Get-Date).AddSeconds($Seconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return
      }
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }
  throw "Timed out waiting for $Url"
}

function Start-DevWindow($Title, $Command) {
  $escapedRoot = $Root.Replace("'", "''")
  $escapedTitle = $Title.Replace("'", "''")
  $fullCommand = "Set-Location -LiteralPath '$escapedRoot'; `$host.UI.RawUI.WindowTitle = '$escapedTitle'; $Command"
  Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $fullCommand | Out-Null
}

Set-Location -LiteralPath $Root

Write-Section "Vibe Share demo mode"
Write-Host "This starts the web-first local demo: API server and PC web app."
Write-Host "PowerShell windows may open. Keep them open while testing."

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

Write-Section "Starting services"
if (Test-PortListening 4000) {
  Write-Host "Server already appears to be running on http://localhost:4000" -ForegroundColor Yellow
} else {
  Start-DevWindow "Vibe Share server" "npm.cmd run dev:server"
  Write-Host "Opened server window."
}
Wait-HttpOk "http://localhost:4000/health" 45
Write-Host "Server health check OK."

if (Test-PortListening 5173) {
  Write-Host "Web app already appears to be running on http://localhost:5173" -ForegroundColor Yellow
} else {
  Start-DevWindow "Vibe Share web app" "npm.cmd run dev:web"
  Write-Host "Opened web app window."
}
Wait-HttpOk "http://localhost:5173" 45
Write-Host "Web app check OK."

if ($StartNativeMobile) {
  if (Test-PortListening 8081) {
    Write-Host "Expo dev server already appears to be running on http://localhost:8081" -ForegroundColor Yellow
  } else {
    Start-DevWindow "Vibe Share mobile Expo" "npm.cmd run dev:mobile"
    Write-Host "Opened Expo mobile window."
  }
}

$lanIp = Get-PrimaryLanIp

Write-Section "Use these addresses"
Write-Host "PC web app:        http://localhost:5173"
Write-Host "API/status server: http://localhost:4000"
if ($lanIp) {
  Write-Host "Phone Safari web check only: http://$lanIp`:5173"
  Write-Host "Mobile app pairing server:  http://$lanIp`:4000"
} else {
  Write-Host "LAN IP was not detected. Run ipconfig and use the IPv4 address that looks like 192.168.x.x." -ForegroundColor Yellow
}

Write-Section "iPhone rule"
Write-Host "Do not open localhost in iPhone Safari. iPhone localhost means the iPhone, not this PC."
Write-Host "Open the PC web app, scan the Vibe Share QR with the iPhone camera, then choose send or receive after 연결됨."
