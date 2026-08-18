param([string]$Container = 'vimes-pdf-signing')
$ErrorActionPreference = 'Stop'
$previous = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$log = @(docker logs $Container 2>&1 | ForEach-Object { $_.ToString() })
$ErrorActionPreference = $previous
$patterns = 'PRIVATE KEY','BEGIN RSA','BEGIN EC','SIGNING_PFX_PASSWORD','PIN=','cms_signature_base64','patient','patient_id','medical_record'
$hits = $log | Select-String -Pattern $patterns -CaseSensitive:$false
if ($hits) {
  $hits | ForEach-Object { Write-Error "Sensitive log pattern detected: $($_.Line)" }
  exit 1
}
Write-Output "No sensitive log patterns detected in $Container"
