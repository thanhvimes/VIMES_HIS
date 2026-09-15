param([Parameter(Mandatory=$true)][string]$BackupPath)
$ErrorActionPreference = 'Stop'
$buckets = @('vimes-document-templates','vimes-document-previews','vimes-generated-documents')
foreach ($bucket in $buckets) {
  $path = Join-Path $BackupPath $bucket
  if (-not (Test-Path $path)) { throw "Missing backup bucket: $bucket" }
  $count = @(Get-ChildItem -LiteralPath $path -Recurse -File).Count
  Write-Output "$bucket files=$count"
}
Write-Output 'Backup structure verification passed.'
