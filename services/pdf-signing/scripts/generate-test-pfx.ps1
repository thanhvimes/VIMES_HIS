param(
  [string]$Output = (Join-Path $PSScriptRoot '..\secrets\signing.pfx'),
  [string]$Password = 'change-me-test-only'
)
$ErrorActionPreference = 'Stop'
$outDir = Split-Path -Parent $Output
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$key = Join-Path $outDir 'signing.key.pem'
$cert = Join-Path $outDir 'signing.cert.pem'
$ext = Join-Path $outDir 'signing.ext.cnf'
@'
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature,nonRepudiation
subjectKeyIdentifier=hash
'@ | Set-Content -LiteralPath $ext -Encoding ascii
openssl req -x509 -newkey rsa:2048 -nodes -keyout $key -out $cert -days 30 -subj '/CN=VIMES HIS TEST ONLY/O=VIMES' -addext 'basicConstraints=critical,CA:FALSE' -addext 'keyUsage=critical,digitalSignature,nonRepudiation' -addext 'subjectKeyIdentifier=hash'
openssl pkcs12 -export -out $Output -inkey $key -in $cert -passout "pass:$Password" -name 'VIMES TEST SIGNER'
Remove-Item -LiteralPath $key,$cert,$ext -Force
Write-Output "Created test-only PFX: $Output"
