param(
  [string]$BaseUrl = 'http://127.0.0.1:8080',
  [string]$InputPdf = '',
  [string]$OutputDir = (Get-Location).Path
)
$ErrorActionPreference = 'Stop'
$health = Invoke-RestMethod "$BaseUrl/ready"
if (-not $health.ready) { throw 'Signing service is not ready' }
if ($env:SIGNING_PROVIDER -eq 'test') { Write-Warning 'Provider=test: contract smoke only; PAdES output is not production evidence.' }
if ($InputPdf -and -not (Test-Path -LiteralPath $InputPdf)) { throw "Input PDF not found: $InputPdf" }
$inputBytes = if ($InputPdf) { [IO.File]::ReadAllBytes($InputPdf) } else { [Text.Encoding]::ASCII.GetBytes('%PDF-1.4`n%%EOF') }
$pdf = [Convert]::ToBase64String($inputBytes)
$payload = @{ pdf_base64 = $pdf; field_name = 'SIG_SMOKE'; page_index = 0; x1_pt = 50; y1_pt = 50; x2_pt = 200; y2_pt = 100; reason = 'Smoke test' } | ConvertTo-Json
try { $result = Invoke-RestMethod "$BaseUrl/v1/sign-pdf" -Method Post -ContentType 'application/json' -Body $payload; if (-not $result.pdf_base64) { throw 'Provider returned no PDF' }; New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null; $signedPath = Join-Path $OutputDir 'smoke-signed.pdf'; $tamperedPath = Join-Path $OutputDir 'smoke-tampered.pdf'; $bytes = [Convert]::FromBase64String($result.pdf_base64); [IO.File]::WriteAllBytes($signedPath, $bytes); $tampered = [byte[]]$bytes.Clone(); $tampered[$tampered.Length - 1] = $tampered[$tampered.Length - 1] -bxor 1; [IO.File]::WriteAllBytes($tamperedPath, $tampered); Write-Output "PAdES smoke output: $signedPath"; Write-Output "Tamper fixture: $tamperedPath (validator must report invalid signature)"; if (Get-Command pdfsig -ErrorAction SilentlyContinue) { pdfsig $signedPath; pdfsig $tamperedPath } else { Write-Warning 'pdfsig not installed: validator result is NOT_VERIFIED.' } } catch { if ($_.Exception.Response.StatusCode.value__ -eq 503) { Write-Warning 'Provider is not configured; smoke stopped without production pass.'; exit 2 }; throw }
