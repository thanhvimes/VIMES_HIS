param(
  [string]$OutputDir = "./backups/template-studio",
  [string]$DbHost = $env:DB_HOST,
  [int]$DbPort = [int]$env:DB_PORT,
  [string]$DbName = $env:DB_NAME,
  [string]$DbUser = $env:DB_USER
)

if ([string]::IsNullOrWhiteSpace($DbHost) -or [string]::IsNullOrWhiteSpace($DbName) -or [string]::IsNullOrWhiteSpace($DbUser)) { throw 'DB_HOST, DB_NAME and DB_USER are required' }
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$target = Join-Path $OutputDir "template-metadata-$stamp.dump"
$tables = @('hms_document_template', 'hms_document_template_version', 'hms_document_data_contract', 'hms_document_template_test_case', 'hms_document_template_test_run', 'hms_document_template_audit', 'hms_document_template_notification')
$args = @('-Fc', '--no-owner', '--no-privileges', '-h', $DbHost, '-p', $DbPort, '-U', $DbUser, '-d', $DbName, '-f', $target)
foreach ($table in $tables) { $args += @('-t', $table) }
& pg_dump @args
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed with exit code $LASTEXITCODE" }
Write-Output "Created $target"
