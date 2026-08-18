param([string]$EvidenceDir='./staging-evidence')
$ErrorActionPreference='Continue'; New-Item -ItemType Directory -Force -Path $EvidenceDir | Out-Null
node backend/scripts/collect-staging-evidence.cjs | Out-File "$EvidenceDir/manifest-output.json"
node backend/scripts/audit-duplicate-artifacts.cjs ./storage/template-studio | Out-File "$EvidenceDir/duplicates.json"
node backend/scripts/parallel-endpoint-probe.cjs | Out-File "$EvidenceDir/clinical-isolation.json"
node backend/scripts/check-signing-readiness.cjs | Out-File "$EvidenceDir/signing-readiness.json"
Write-Output "Acceptance bundle collected in $EvidenceDir"
