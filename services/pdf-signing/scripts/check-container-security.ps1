param([string]$Container = 'vimes-pdf-signing')
$ErrorActionPreference = 'Stop'
$inspect = docker inspect $Container | ConvertFrom-Json
$hostConfig = $inspect[0].HostConfig
if (-not $hostConfig.ReadonlyRootfs) { throw 'ReadonlyRootfs must be true' }
if ($hostConfig.Privileged) { throw 'Privileged container is forbidden' }
$secret = $inspect[0].Mounts | Where-Object Destination -eq '/run/secrets'
if (-not $secret -or $secret.RW) { throw '/run/secrets must be mounted read-only' }
Write-Output "Container security checks passed for $Container"
