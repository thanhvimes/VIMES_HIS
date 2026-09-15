param(
  [int]$IntervalSeconds = 10,
  [int]$Samples = 6,
  [double]$CpuAlertPercent = 85,
  [double]$MemoryAlertPercent = 85
)

$containers = @('vimes-carbone-renderer-1', 'vimes-carbone-renderer-2')
for ($i = 0; $i -lt $Samples; $i++) {
  $rows = docker stats --no-stream --format '{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}' 2>$null
  foreach ($row in $rows) {
    $parts = $row -split '\|'
    if ($containers -contains $parts[0]) {
      $cpu = [double](($parts[1] -replace '[^0-9\.]',''))
      $mem = [double](($parts[3] -replace '[^0-9\.]',''))
      $level = if ($cpu -ge $CpuAlertPercent -or $mem -ge $MemoryAlertPercent) { 'ALERT' } else { 'OK' }
      '{0:o} {1} cpu={2}% mem={3}% usage={4}' -f (Get-Date), $level, $parts[1], $parts[3], $parts[2]
    }
  }
  if ($i -lt ($Samples - 1)) { Start-Sleep -Seconds $IntervalSeconds }
}
