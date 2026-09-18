# Script cap nhat file appsettings.json vao thu muc cai dat C:\Program Files va khoi dong lai VIMES Workstation Agent
$ErrorActionPreference = 'Stop'

$sourceConfig = "D:\AI\VIMES_HIS\modules\health-check-sync\tools\Vimes.PrintAgent\publish\win-x64\appsettings.json"
$targetDir = "C:\Program Files\VIMES Workstation Agent"
$targetConfig = Join-Path $targetDir "appsettings.json"

Write-Host "Dang sao chep cau hinh tu $sourceConfig sang $targetConfig..."
if (Test-Path $targetDir) {
    Copy-Item -Path $sourceConfig -Destination $targetConfig -Force
    Write-Host "Da sao chep thanh cong vao $targetConfig"
}

# Dong thoi sao chep vao ProgramData
$programDataDir = "C:\ProgramData\VIMES\WorkstationAgent"
if (-not (Test-Path $programDataDir)) {
    New-Item -ItemType Directory -Path $programDataDir -Force | Out-Null
}
Copy-Item -Path $sourceConfig -Destination (Join-Path $programDataDir "appsettings.json") -Force
Write-Host "Da sao chep thanh cong vao $programDataDir\appsettings.json"

Write-Host "Dang khoi dong lai dich vu VIMES Workstation Agent..."
Restart-Service -Name "VIMES Workstation Agent" -Force
Write-Host "Dich vu VIMES Workstation Agent da khoi dong lai thanh cong!"
