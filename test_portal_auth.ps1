# Test Portal Authentication APIs

$baseUrl = "http://localhost:3000/api/v1/portal"

Write-Host "`n=== Test 1: Activate Account ===" -ForegroundColor Cyan
$activateBody = @{
    phone     = "0918387886"
    patientNo = "17081622"
    password  = "123456"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/activate" -Method POST -Body $activateBody -ContentType "application/json"
    Write-Host "✓ Activation Success:" -ForegroundColor Green
    $response | ConvertTo-Json
}
catch {
    Write-Host "✗ Activation Failed:" -ForegroundColor Red
    $_.Exception.Response.StatusCode
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $reader.ReadToEnd()
}

Write-Host "`n=== Test 2: Login ===" -ForegroundColor Cyan
$loginBody = @{
    phone    = "0918387886"
    password = "123456"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✓ Login Success:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
    
    # Save token for further tests
    $global:token = $response.token
}
catch {
    Write-Host "✗ Login Failed:" -ForegroundColor Red
    $_.Exception.Response.StatusCode
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $reader.ReadToEnd()
}
