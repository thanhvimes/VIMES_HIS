param(
  [string]$Target = "./backups/minio-template-$(Get-Date -Format yyyyMMdd-HHmmss)"
)
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path $Target | Out-Null
if (-not (Get-Command mc -ErrorAction SilentlyContinue)) { throw 'MinIO mc is required' }
$alias = $env:MINIO_ALIAS; if (-not $alias) { $alias = 'vimes-local' }
$buckets = @('vimes-document-templates','vimes-document-previews','vimes-generated-documents')
foreach ($bucket in $buckets) {
  & mc mirror --overwrite "$alias/$bucket" (Join-Path $Target $bucket)
  if ($LASTEXITCODE -ne 0) { throw "Backup failed for $bucket" }
}
Write-Output "Backup completed: $Target"
