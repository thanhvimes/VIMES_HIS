param([ValidateSet('soak4h','restart-worker','redis-interruption','minio-interruption','p95-evaluation')][string]$Scenario='soak4h')
$ErrorActionPreference='Stop'
switch($Scenario){
 'soak4h'{node backend/scripts/run-template-load-profiles.cjs soak4h}
 'restart-worker'{docker restart vimes-template-preview-worker 2>$null; node backend/scripts/verify-template-queue-recovery.cjs}
 'redis-interruption'{docker stop vimes-redis-template-queue; Start-Sleep 5; docker start vimes-redis-template-queue; node backend/scripts/dependency-health-probe.cjs}
 'minio-interruption'{docker stop vimes-minio-template-storage; Start-Sleep 5; docker start vimes-minio-template-storage; node backend/scripts/dependency-health-probe.cjs}
 'p95-evaluation'{node backend/scripts/evaluate-template-benchmark.cjs $env:BENCHMARK_RESULT}
}
