#!/usr/bin/env pwsh
# Final fix: Force rebuild frontend to load new code

Write-Host "`n🔧 vClinic Frontend Rebuild Script" -ForegroundColor Cyan
Write-Host "===================================`n" -ForegroundColor Cyan

# Step 1: Stop all node processes
Write-Host "Step 1: Stopping all Node processes..." -ForegroundColor Yellow
try {
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "✅ Stopped`n" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  No Node processes found`n" -ForegroundColor Yellow
}

# Step 2: Clear Vite cache
Write-Host "Step 2: Clearing Vite cache..." -ForegroundColor Yellow
$viteCachePath = "d:\AI\vClinic\node_modules\.vite"
if (Test-Path $viteCachePath) {
    Remove-Item -Path $viteCachePath -Recurse -Force
    Write-Host "✅ Cleared: $viteCachePath`n" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Cache not found`n" -ForegroundColor Yellow
}

# Step 3: Clear dist
Write-Host "Step 3: Clearing dist..." -ForegroundColor Yellow
$distPath = "d:\AI\vClinic\dist"
if (Test-Path $distPath) {
    Remove-Item -Path $distPath -Recurse -Force
    Write-Host "✅ Cleared: $distPath`n" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Dist not found`n" -ForegroundColor Yellow
}

# Step 4: Verify backend is running
Write-Host "Step 4: Checking backend..." -ForegroundColor Yellow
$backend = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($backend) {
    Write-Host "✅ Backend is running on port 3000`n" -ForegroundColor Green
}
else {
    Write-Host "❌ Backend NOT running!" -ForegroundColor Red
    Write-Host "   Please start backend first:`n" -ForegroundColor Yellow
    Write-Host "   cd d:\AI\vClinic\backend" -ForegroundColor White
    Write-Host "   npm run dev`n" -ForegroundColor White
    exit 1
}

# Done
Write-Host "✅ PREPARATION COMPLETE!`n" -ForegroundColor Green
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Open a NEW terminal" -ForegroundColor White
Write-Host "2. Run: cd d:\AI\vClinic" -ForegroundColor White
Write-Host "3. Run: npm run dev" -ForegroundColor White
Write-Host "4. Wait for Vite to start" -ForegroundColor White
Write-Host "5. Open INCOGNITO window (Ctrl+Shift+N)" -ForegroundColor White
Write-Host "6. Go to: http://localhost:5173" -ForegroundColor White
Write-Host "7. Login and test!`n" -ForegroundColor White
