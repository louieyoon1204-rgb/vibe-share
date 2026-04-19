param(
  [int]$ServerPort = 4000,
  [int]$WebPort = 5173
)

$ErrorActionPreference = "SilentlyContinue"

function Write-Section($Text) {
  Write-Host ""
  Write-Host "== $Text ==" -ForegroundColor Cyan
}

function Get-BestLanAddress {
  $configs = @(Get-NetIPConfiguration | Where-Object {
      $_.IPv4Address -and
      $_.IPv4DefaultGateway -and
      $_.NetAdapter.Status -eq "Up" -and
      $_.NetAdapter.InterfaceDescription -notmatch "WSL|Docker|Hyper-V|VirtualBox|VMware|Loopback|Wi-Fi Direct"
    })

  foreach ($config in $configs) {
    foreach ($address in @($config.IPv4Address)) {
      $ip = [string]$address.IPAddress
      if ($ip -match "^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)" -and $ip -notmatch "^169\.254\.") {
        return [pscustomobject]@{
          IP = $ip
          InterfaceAlias = $config.InterfaceAlias
          InterfaceDescription = $config.NetAdapter.InterfaceDescription
          Gateway = [string]$config.IPv4DefaultGateway.NextHop
        }
      }
    }
  }

  return $null
}

function Test-Http($Label, $Url) {
  try {
    $result = & curl.exe --silent --show-error --fail --max-time 5 $Url 2>&1
    if ($LASTEXITCODE -eq 0) {
      Write-Host "[OK] $Label" -ForegroundColor Green
      Write-Host "     $Url"
      return $true
    }
    Write-Host "[FAIL] $Label" -ForegroundColor Red
    Write-Host "       $Url"
    Write-Host "       $result"
    return $false
  } catch {
    Write-Host "[FAIL] $Label" -ForegroundColor Red
    Write-Host "       $Url"
    Write-Host "       $($_.Exception.Message)"
    return $false
  }
}

function Show-Listen($Port) {
  $listeners = @(Get-NetTCPConnection -LocalPort $Port -State Listen)
  if (-not $listeners.Count) {
    Write-Host "[FAIL] port $Port is not listening" -ForegroundColor Red
    return
  }
  foreach ($listener in $listeners) {
    $process = Get-Process -Id $listener.OwningProcess
    $ok = $listener.LocalAddress -eq "0.0.0.0" -or $listener.LocalAddress -eq "::"
    $color = if ($ok) { "Green" } else { "Yellow" }
    Write-Host "[$(if ($ok) { 'OK' } else { 'WARN' })] port $Port listens on $($listener.LocalAddress) by $($process.ProcessName) pid $($listener.OwningProcess)" -ForegroundColor $color
  }
}

Write-Section "Vibe Share local network check"

$lan = Get-BestLanAddress
if ($lan) {
  Write-Host "Current LAN IP: $($lan.IP)"
  Write-Host "Network adapter: $($lan.InterfaceAlias) / $($lan.InterfaceDescription)"
  Write-Host "Gateway: $($lan.Gateway)"
} else {
  Write-Host "Current LAN IP: not found" -ForegroundColor Red
  Write-Host "Connect this PC to Wi-Fi or hotspot first."
}

Write-Section "Listening ports"
Show-Listen $ServerPort
Show-Listen $WebPort

Write-Section "HTTP checks from this PC"
$localhostServerOk = Test-Http "server localhost health" "http://localhost:$ServerPort/health"
$localhostWebOk = Test-Http "web localhost" "http://localhost:$WebPort"

if ($lan) {
  $lanServerOk = Test-Http "server LAN health" "http://$($lan.IP):$ServerPort/health"
  $lanWebOk = Test-Http "web LAN" "http://$($lan.IP):$WebPort"
} else {
  $lanServerOk = $false
  $lanWebOk = $false
}

Write-Section "Network profile"
Get-NetConnectionProfile | Select-Object Name,InterfaceAlias,NetworkCategory,IPv4Connectivity | Format-Table -AutoSize

Write-Section "Firewall summary"
$profile = netsh advfirewall show currentprofile
($profile | Select-String -Pattern "State|Firewall Policy|LocalFirewallRules").Line
$nodeRules = netsh advfirewall firewall show rule name="Node.js JavaScript Runtime" verbose
if ($nodeRules -match "Action:\s+Allow" -and $nodeRules -match "Protocol:\s+TCP") {
  Write-Host "[OK] Node.js inbound TCP allow rule exists" -ForegroundColor Green
} else {
  Write-Host "[WARN] Node.js inbound TCP allow rule was not confirmed" -ForegroundColor Yellow
}

Write-Section "Docker"
docker desktop status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Section "Phone check"
if ($lan) {
  Write-Host "Open these on iPhone Safari while the phone and PC are on the same Wi-Fi or hotspot:"
  Write-Host "  http://$($lan.IP):$ServerPort/health"
  Write-Host "  http://$($lan.IP):$WebPort"
}

if ($localhostServerOk -and $localhostWebOk -and $lanServerOk -and $lanWebOk) {
  Write-Host ""
  Write-Host "Result: PC-side checks passed. If iPhone still cannot open the URLs, check iPhone Wi-Fi/hotspot and router client isolation." -ForegroundColor Green
  exit 0
}

Write-Host ""
Write-Host "Result: one or more PC-side checks failed. Fix the failed item above before QR testing." -ForegroundColor Red
exit 1
