param([Parameter(Mandatory=$true)][string]$Baseline, [Parameter(Mandatory=$true)][string]$Actual)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path $Baseline) -or -not (Test-Path $Actual)) { throw 'Both PDF files are required' }
$b = Get-FileHash -Algorithm SHA256 -LiteralPath $Baseline
$a = Get-FileHash -Algorithm SHA256 -LiteralPath $Actual
$result = [ordered]@{ baseline=$Baseline; actual=$Actual; baselineBytes=(Get-Item $Baseline).Length; actualBytes=(Get-Item $Actual).Length; baselineSha256=$b.Hash; actualSha256=$a.Hash; equal=($b.Hash -eq $a.Hash) }
$result | ConvertTo-Json -Compress
if (-not $result.equal) { exit 1 }
