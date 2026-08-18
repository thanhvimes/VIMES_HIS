$ErrorActionPreference = 'Stop'
if ($env:NODE_ENV -ne 'production') { throw 'NODE_ENV must be production' }
if ($env:SIGNING_PROVIDER -in @('', 'test')) { throw 'Production requires a real signing provider' }
if ($env:PDF_SIGNING_BIND -eq '0.0.0.0') { throw 'Do not bind signing service publicly without approved proxy policy' }
foreach ($name in @('SIGNING_TSA_URL','SIGNING_OCSP_URL','SIGNING_CRL_URL')) {
  $value = (Get-Item "Env:$name" -ErrorAction SilentlyContinue).Value
  if ([string]::IsNullOrWhiteSpace($value)) { throw "$name is required in production" }
  if (-not $value.StartsWith('https://', [StringComparison]::OrdinalIgnoreCase)) { throw "$name must use HTTPS" }
}
if ($env:SIGNING_PROFILE -ne 'PAdES-B-T') { throw 'Production SIGNING_PROFILE must be PAdES-B-T' }
if ($env:SIGNING_REVOCATION_MODE -ne 'hard-fail') { throw 'SIGNING_REVOCATION_MODE must be hard-fail' }
if ([string]::IsNullOrWhiteSpace($env:SIGNING_TRUST_ROOTS_DIR) -or -not (Test-Path -LiteralPath $env:SIGNING_TRUST_ROOTS_DIR -PathType Container)) { throw 'SIGNING_TRUST_ROOTS_DIR must exist' }
$roots = Get-ChildItem -LiteralPath $env:SIGNING_TRUST_ROOTS_DIR -File | Where-Object { $_.Extension -in '.pem','.cer','.crt','.der' }
if (-not $roots) { throw 'At least one approved trust root is required' }
Write-Output 'Production signing configuration checks passed'
