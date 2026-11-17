# Reads the scoped Cloudflare API token and wires up Cloudflare for SaaS.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$tokenFile = @("cloudflare-token.txt", ".cloudflare-token", ".cloudflare-token.txt") |
  Where-Object { Test-Path (Join-Path $root $_) } |
  Select-Object -First 1
if (-not $tokenFile) {
  Write-Output "ERROR: token file missing"
  exit 1
}
$token = (Get-Content (Join-Path $root $tokenFile) -Raw).Trim()
if (-not $token) {
  Write-Output "ERROR: token file empty"
  exit 1
}

$zone = "fdc0da8cfba5a4679e781584d82225ff"
$zoneName = "beepanal.store"
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
$api = "https://api.cloudflare.com/client/v4"

function Call($method, $path, $body) {
  $params = @{ Method = $method; Uri = "$api$path"; Headers = $headers; TimeoutSec = 60 }
  if ($body) { $params.Body = ($body | ConvertTo-Json -Depth 8 -Compress) }
  try {
    return Invoke-RestMethod @params
  } catch {
    $resp = $_.Exception.Response
    if ($resp) {
      $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
      $text = $reader.ReadToEnd()
      Write-Output "HTTP ERROR $path -> $text"
    } else {
      Write-Output "HTTP ERROR $path -> $($_.Exception.Message)"
    }
    return $null
  }
}

Write-Output "--- token check ---"
$verify = Call "GET" "/zones/$zone"
if (-not $verify -or -not $verify.success) {
  Write-Output "Token cannot read the zone. Aborting."
  exit 1
}
Write-Output "zone=$($verify.result.name) status=$($verify.result.status)"

Write-Output "--- custom hostnames enabled? ---"
$ch = Call "GET" "/zones/$zone/custom_hostnames?per_page=1"
if ($ch -and $ch.success) {
  Write-Output "custom hostnames API: OK"
} else {
  Write-Output "custom hostnames API: NOT READY (enable Cloudflare for SaaS first)"
}

Write-Output "--- dns records ---"
$records = Call "GET" "/zones/$zone/dns_records?per_page=100"
if ($records -and $records.success) {
  $records.result | Select-Object id, type, name, content, proxied | Format-Table -AutoSize
} else {
  Write-Output "Cannot list DNS records (token needs Zone:DNS:Edit)."
}

Write-Output "--- routes ---"
$routes = Call "GET" "/zones/$zone/workers/routes"
if ($routes -and $routes.success) {
  $routes.result | Select-Object pattern, script | Format-Table -AutoSize
}
