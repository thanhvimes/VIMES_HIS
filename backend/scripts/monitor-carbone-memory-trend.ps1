param([int]$IntervalSeconds=60, [int]$Samples=30, [double]$GrowthPercentAlert=25)
$names=@('vimes-carbone-renderer-1','vimes-carbone-renderer-2'); $first=@{}; $last=@{}
for($i=0;$i -lt $Samples;$i++) {
  $rows=docker stats --no-stream --format '{{.Name}}|{{.MemUsage}}|{{.MemPerc}}' 2>$null
  foreach($row in $rows) { $p=$row -split '\|'; if($names -contains $p[0]) { $bytes=0; if($p[1] -match '([0-9\.]+)(MiB|GiB|MB|GB)') { $bytes=[double]$matches[1] * ($(if($matches[2] -match 'GiB|GB'){1GB}else{1MB})) }; if(-not $first.ContainsKey($p[0])){$first[$p[0]]=$bytes};$last[$p[0]]=$bytes; '{0:o} {1} mem={2}' -f (Get-Date),$p[0],$p[1] } }
  if($i -lt $Samples-1){Start-Sleep -Seconds $IntervalSeconds}
}
foreach($name in $first.Keys){$growth=if($first[$name]){(($last[$name]-$first[$name])*100/$first[$name])}else{0}; $level=if($growth -ge $GrowthPercentAlert){'ALERT'}else{'OK'}; "{0} {1} growth={2:N1}%" -f $level,$name,$growth}
