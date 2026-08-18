param([string]$LoadBalancerUrl='http://localhost:4000/health')
$ErrorActionPreference='Stop'
$containers=@('vimes-carbone-renderer-1','vimes-carbone-renderer-2')
$states=@{}
foreach($c in $containers){$states[$c]=(docker inspect --format '{{.State.Health.Status}}' $c 2>$null)}
$response=Invoke-WebRequest -Uri $LoadBalancerUrl -UseBasicParsing -TimeoutSec 5
$ok=$response.StatusCode -ge 200 -and $response.StatusCode -lt 500
[ordered]@{ loadBalancerStatus=$response.StatusCode; workers=$states; isolatedWorker=($states.Values -contains 'unhealthy'); loadBalancerAvailable=$ok } | ConvertTo-Json -Compress
if(-not $ok){exit 1}
