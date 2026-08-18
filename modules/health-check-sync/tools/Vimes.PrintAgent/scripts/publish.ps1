$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$publishDirectory = Join-Path $projectRoot 'publish\win-x64'

function Invoke-AgentPublish([string]$projectPath) {
    dotnet publish $projectPath -c Release -r win-x64 --self-contained true -o $publishDirectory
    if ($LASTEXITCODE -ne 0) {
        throw "dotnet publish failed for $projectPath with exit code $LASTEXITCODE"
    }
}

Invoke-AgentPublish (Join-Path $projectRoot 'src\Vimes.Agent.Host\Vimes.Agent.Host.csproj')
Invoke-AgentPublish (Join-Path $projectRoot 'src\Vimes.Agent.Desktop\Vimes.Agent.Desktop.csproj')

$requiredFiles = @('Vimes.WorkstationAgent.exe', 'Vimes.WorkstationAgent.Desktop.exe')
foreach ($requiredFile in $requiredFiles) {
    if (-not (Test-Path (Join-Path $publishDirectory $requiredFile))) {
        throw "Published output is missing $requiredFile"
    }
}

# Ensure Assets directory and icons are present in publish directory
$assetsTargetDir = Join-Path $publishDirectory 'Assets'
if (-not (Test-Path $assetsTargetDir)) {
    New-Item -ItemType Directory -Path $assetsTargetDir -Force | Out-Null
}
$sourceAssets = Join-Path $projectRoot 'src\Vimes.Agent.Desktop\Assets'
if (Test-Path $sourceAssets) {
    Copy-Item -Path "$sourceAssets\*" -Destination $assetsTargetDir -Force
    Copy-Item -Path "$sourceAssets\vimes.ico" -Destination $publishDirectory -Force
    Copy-Item -Path "$sourceAssets\vimes.png" -Destination $publishDirectory -Force
}

Write-Host "Published VIMES Workstation Agent to $publishDirectory"

# Compile Inno Setup installer if iscc is found
$isccCandidates = @(
    (Get-Command iscc -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue),
    "C:\Users\thanh\AppData\Local\Programs\Inno Setup 6\iscc.exe",
    "C:\Program Files (x86)\Inno Setup 6\iscc.exe",
    "C:\Program Files\Inno Setup 6\iscc.exe"
)
$isccPath = $isccCandidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

if ($isccPath) {
    $issFile = Join-Path $projectRoot 'Installer\Vimes.PrintAgent.iss'
    Write-Host "Compiling Inno Setup installer with $isccPath..."
    & $isccPath $issFile
    if ($LASTEXITCODE -ne 0) {
        throw "Inno Setup compilation failed with exit code $LASTEXITCODE"
    }
    Write-Host "Setup package successfully compiled."
} else {
    Write-Host "Inno Setup compiler (iscc.exe) not found, skipping installer build."
}
