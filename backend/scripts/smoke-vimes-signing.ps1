param(
  [string]$BaseUrl = 'http://127.0.0.1:3001',
  [string]$SigningUrl = 'http://127.0.0.1:8082',
  [string]$InputPdf = 'backend/storage/template-studio/test-runs/DISCHARGE_SUMMARY/v1/10.pdf',
  [string]$OutputPdf = 'staging-evidence/PG-11/latest/his-vimes-signed.pdf'
)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $InputPdf)) { throw "Input PDF not found: $InputPdf" }
$bytes = [IO.File]::ReadAllBytes($InputPdf)
$payload = @{ pdfBase64=[Convert]::ToBase64String($bytes); pageIndex=0; x1Pt=36; y1Pt=36; x2Pt=180; y2Pt=90; fieldName='HIS_SMOKE'; reason='HIS VIMES signing smoke'; idempotencyKey="HIS-SMOKE-$([guid]::NewGuid())" } | ConvertTo-Json
$response = Invoke-RestMethod "$BaseUrl/api/health-check/documents/sign-pdf-vimes" -Method Post -ContentType 'application/json' -Headers @{ 'X-Request-ID' = "HIS-SMOKE-$([guid]::NewGuid())" } -Body $payload
if (-not $response.success -or -not $response.data.pdfBase64) { throw 'HIS signing endpoint returned no signed PDF' }
$outDir = Split-Path -Parent $OutputPdf; New-Item -ItemType Directory -Force -Path $outDir | Out-Null
[IO.File]::WriteAllBytes($OutputPdf, [Convert]::FromBase64String($response.data.pdfBase64))
Write-Output "Signed PDF written to $OutputPdf"
Get-FileHash -LiteralPath $OutputPdf -Algorithm SHA256
