#!/usr/bin/env pwsh
# Auto-fix script: Force reload frontend with new code

Write-Host "🔧 AUTO-FIX: Force Reload Frontend" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill all node processes
Write-Host "Step 1: Stopping all Node.js processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✅ Done" -ForegroundColor Green
Write-Host ""

# Step 2: Clear Vite cache
Write-Host "Step 2: Clearing Vite cache..." -ForegroundColor Yellow
$viteCachePath = "d:\AI\vClinic\node_modules\.vite"
if (Test-Path $viteCachePath) {
    Remove-Item -Path $viteCachePath -Recurse -Force
    Write-Host "✅ Cleared: $viteCachePath" -ForegroundColor Green
} else {
    Write-Host "⚠️  Cache not found (already clean)" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Clear dist
Write-Host "Step 3: Clearing dist..." -ForegroundColor Yellow
$distPath = "d:\AI\vClinic\dist"
if (Test-Path $distPath) {
    Remove-Item -Path $distPath -Recurse -Force
    Write-Host "✅ Cleared: $distPath" -ForegroundColor Green
} else {
    Write-Host "⚠️  Dist not found" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Verify ports are free
Write-Host "Step 4: Verifying ports are free..." -ForegroundColor Yellow
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue

if ($port3000) {
    Write-Host "⚠️  Port 3000 still in use, killing..." -ForegroundColor Yellow
    $port3000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

if ($port5173) {
    Write-Host "⚠️  Port 5173 still in use, killing..." -ForegroundColor Yellow
    $port5173 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

Start-Sleep -Seconds 2
Write-Host "✅ Ports are free" -ForegroundColor Green
Write-Host ""

# Done
Write-Host "✅ AUTO-FIX COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Open TWO terminals" -ForegroundColor White
Write-Host "2. Terminal 1: cd d:\AI\vClinic\backend && npm run dev" -ForegroundColor White
Write-Host "3. Terminal 2: cd d:\AI\vClinic && npm run dev" -ForegroundColor White
Write-Host "4. Wait for both to start" -ForegroundColor White
Write-Host "5. Open browser: http://localhost:5173" -ForegroundColor White
Write-Host "6. Hard reload: Ctrl+Shift+R" -ForegroundColor White
Write-Host "7. Login and test!" -ForegroundColor White
Write-Host ""
