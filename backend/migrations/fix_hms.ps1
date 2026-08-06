$content = Get-Content -Path "D:\DEV\Programs_HIS_K\VIMESReceptionMangr\HMSRegistration.cpp" -Raw -Encoding Unicode
$replacement = Get-Content -Path "D:\AI\VIMES_HIS\backend\migrations\temp_block_utf8.txt" -Raw -Encoding UTF8
$replacement = $replacement -replace "`n", "`r`n"
$replacement = $replacement -replace "`r`r", "`r"

$startStr = '	rpt.GetReportHeader()->SetValue(_T("ExamRoom"), rs.GetValue(_T("roomname")));'
$endStrActual = "return rs.GetIntValue();`r`n`r`n}"

$startIndex = $content.IndexOf($startStr)
$endIndex = $content.IndexOf($endStrActual, $startIndex)

if ($startIndex -ge 0 -and $endIndex -ge 0) {
    $endIndex += $endStrActual.Length
    $newContent = $content.Substring(0, $startIndex) + $replacement + $content.Substring($endIndex)
    Set-Content -Path "D:\DEV\Programs_HIS_K\VIMESReceptionMangr\HMSRegistration.cpp" -Value $newContent -Encoding Unicode
    Write-Host "Success"
} else {
    Write-Host "Failed to find start or end index. Start: $startIndex, End: $endIndex"
}
