# Bee Panal - one-time setup for the free custom-domain proxy.
# Run in PowerShell from anywhere:   .\custom-domain-proxy\setup.ps1
# Needs: netlify-cli logged in (`netlify login`) and wrangler logged in (`npx wrangler login`).
# Secrets are generated or typed here, on your machine; nothing is printed.

$ErrorActionPreference = "Stop"
$proxyDir = $PSScriptRoot
$repoRoot = Split-Path $PSScriptRoot -Parent

$siteName = Read-Host "Netlify site name (example: bp-domains)"
if (-not $siteName) { $siteName = "bp-domains" }

# 1) Shared secret between Netlify and the platform.
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$secret = -join ($bytes | ForEach-Object { $_.ToString("x2") })

$stateFile = Join-Path $proxyDir ".netlify\state.json"
Push-Location $proxyDir
try {
  if (Test-Path $stateFile) {
    # A previous run already created and linked the site; reuse it.
    Write-Host "`n[1/5] Netlify site already linked, reusing it." -ForegroundColor Cyan
  } else {
    Write-Host "`n[1/5] Creating Netlify site '$siteName'..." -ForegroundColor Cyan
    netlify sites:create --name $siteName --disable-linking
    if ($LASTEXITCODE -ne 0) { throw "netlify sites:create failed (name taken? try another)." }
    netlify link --name $siteName
    if ($LASTEXITCODE -ne 0) { throw "netlify link failed." }
  }
  $state = Get-Content $stateFile -Raw | ConvertFrom-Json
  $siteId = $state.siteId
  if (-not $siteId) { throw "Could not read the Netlify site id from .netlify\state.json." }

  Write-Host "[2/5] Setting Netlify environment variables..." -ForegroundColor Cyan
  netlify env:set BP_ORIGIN "https://beepanal.store" | Out-Null
  netlify env:set BP_PROXY_SECRET $secret | Out-Null

  Write-Host "[3/5] Deploying the proxy to production..." -ForegroundColor Cyan
  netlify deploy --prod --dir public
  if ($LASTEXITCODE -ne 0) { throw "netlify deploy failed." }
} finally {
  Pop-Location
}

$health = "https://$siteName.netlify.app/.well-known/beepanal-proxy"
try {
  $check = Invoke-RestMethod -Uri $health -TimeoutSec 20
  if ($check.ok) { Write-Host "      Proxy is up: $health" -ForegroundColor Green }
} catch {
  Write-Host "      Proxy health check failed ($health). Check the deploy in Netlify." -ForegroundColor Yellow
}

# 2) Secrets on the Cloudflare Worker (bee-panal). This creates a new Worker
#    version with the code that is live now; that code ignores these variables
#    until the new platform code is deployed.
Write-Host "[4/5] Saving platform secrets on Cloudflare..." -ForegroundColor Cyan
Push-Location $repoRoot
$tmp = Join-Path $env:TEMP ("bp-secrets-" + [guid]::NewGuid().ToString() + ".json")
try {
  @{
    CUSTOM_DOMAIN_PROXY_SECRET = $secret
    CUSTOM_DOMAIN_PROXY_TARGET = "$siteName.netlify.app"
    NETLIFY_SITE_ID            = $siteId
  } | ConvertTo-Json | Set-Content -Path $tmp -Encoding utf8
  npx wrangler secret bulk $tmp
  if ($LASTEXITCODE -ne 0) { throw "wrangler secret bulk failed." }
} finally {
  Remove-Item $tmp -ErrorAction SilentlyContinue
}

Write-Host "`n      Netlify API token: Netlify > User settings > Applications > Personal access tokens."
Write-Host "      wrangler will ask you to paste it (input is hidden):"
npx wrangler secret put NETLIFY_API_TOKEN

Write-Host "`n      Apex IP: copy Netlify's load balancer IP from the Netlify docs page"
Write-Host "      'Configure external DNS for a custom domain' and paste it:"
npx wrangler secret put CUSTOM_DOMAIN_PROXY_APEX_IP
Pop-Location

Write-Host "`n[5/5] Done. Next: deploy the platform code from this branch." -ForegroundColor Green
