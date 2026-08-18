$ErrorActionPreference = 'Stop'
function Expect-Blocked([hashtable]$vars, [string]$label) {
  $old = @{}
  foreach ($key in $vars.Keys) { $old[$key] = [Environment]::GetEnvironmentVariable($key); [Environment]::SetEnvironmentVariable($key, $vars[$key]) }
  try { & "$PSScriptRoot/validate-production-config.ps1" 2>$null; throw "Gate unexpectedly passed: $label" } catch { if ($_.Exception.Message -like "Gate unexpectedly*") { throw } }
  finally { foreach ($key in $vars.Keys) { [Environment]::SetEnvironmentVariable($key, $old[$key]) } }
}

$trustRootFixture = Join-Path ([IO.Path]::GetTempPath()) ("vimes-trust-gate-" + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $trustRootFixture | Out-Null
Set-Content -LiteralPath (Join-Path $trustRootFixture 'approved-root.pem') -Value 'CONFIG-GATE-FIXTURE' -Encoding ascii
$env:NODE_ENV='production'; $env:SIGNING_PROVIDER='local-agent'; $env:PDF_SIGNING_BIND='127.0.0.1'; $env:SIGNING_TSA_URL='https://tsa.example'; $env:SIGNING_OCSP_URL='https://ocsp.example'; $env:SIGNING_CRL_URL='https://crl.example'; $env:SIGNING_PROFILE='PAdES-B-T'; $env:SIGNING_REVOCATION_MODE='hard-fail'; $env:SIGNING_TRUST_ROOTS_DIR=$trustRootFixture
& "$PSScriptRoot/validate-production-config.ps1"
Expect-Blocked @{ SIGNING_PROVIDER='test' } 'test provider'
Expect-Blocked @{ PDF_SIGNING_BIND='0.0.0.0' } 'public bind'
Expect-Blocked @{ SIGNING_TSA_URL='' } 'missing TSA'
Expect-Blocked @{ SIGNING_REVOCATION_MODE='soft-fail' } 'soft revocation mode'
Expect-Blocked @{ SIGNING_PROFILE='PAdES-B-B' } 'non timestamped production profile'
Remove-Item -LiteralPath $trustRootFixture -Recurse -Force
Write-Output 'Production config gate negative tests passed'
