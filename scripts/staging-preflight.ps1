$ErrorActionPreference='Continue'
$services=@('vimes-redis-template-queue','vimes-minio-template-storage','vimes-carbone-lb','vimes-template-preview-worker')
$rows=@();foreach($s in $services){$status=docker inspect --format '{{.State.Status}}' $s 2>$null;$rows+= [ordered]@{service=$s;status=if($status){$status.Trim()}else{'missing'}}}
$workerHost = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match 'template-preview-worker' }).Count -gt 0
if ($rows[-1].status -eq 'missing' -and $workerHost) { $rows[-1].status = 'running-host' }
$healthy=($rows|?{$_.status -like 'running*'}).Count -eq $services.Count;[ordered]@{capturedAt=(Get-Date).ToString('o');services=$rows;ready=$healthy}|ConvertTo-Json -Depth 4; if(-not $healthy){exit 1}
