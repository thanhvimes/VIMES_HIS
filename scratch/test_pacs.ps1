$loginUrl = "http://logindkninhbinhthanglong.pmr.vn:8080/Login.aspx"
$actionUrl = "http://logindkninhbinhthanglong.pmr.vn:8080/Login.aspx?AspxAutoDetectCookieSupport=1"

# Initialize WebSession
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

function Fetch-WebPage {
    param(
        [string]$Uri,
        [string]$Method = "GET",
        $Body = $null,
        $Session = $null
    )
    
    $currentUri = $Uri
    $redirectCount = 0
    $maxRedirects = 10
    
    while ($redirectCount -lt $maxRedirects) {
        Write-Host "--> [$Method] $currentUri"
        
        $headers = @{
            "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        $response = $null
        try {
            if ($Method -eq "POST") {
                $response = Invoke-WebRequest -Uri $currentUri -Method Post -Body $Body -WebSession $Session -Headers $headers -MaximumRedirection 0 -UseBasicParsing
            } else {
                $response = Invoke-WebRequest -Uri $currentUri -Method Get -WebSession $Session -Headers $headers -MaximumRedirection 0 -UseBasicParsing
            }
        }
        catch {
            # In PowerShell, redirect exception holds the response
            if ($_.Exception.Response) {
                $response = $_.Exception.Response
            } else {
                Write-Host "Non-HTTP Error: $_"
                return $null
            }
        }
        
        if ($response -eq $null) {
            Write-Host "Error: Response is null"
            return $null
        }
        
        $statusCode = [int]$response.StatusCode
        Write-Host "Status: $statusCode"
        
        if ($statusCode -eq 302 -or $statusCode -eq 301 -or $statusCode -eq 307 -or $statusCode -eq 308) {
            # Extract Location header
            $location = $response.Headers["Location"]
            if (-not $location) {
                $location = $response.Headers["location"]
            }
            
            Write-Host "Redirect location header: $location"
            
            if ($location -match "^https?://") {
                $currentUri = $location
            } elseif ($location.StartsWith("/")) {
                $u = New-Object System.Uri($currentUri)
                $currentUri = "$($u.Scheme)://$($u.Authority)$location"
            } elseif ($location -match "pmr.vn") {
                $currentUri = "http://$location"
            } else {
                $u = New-Object System.Uri($currentUri)
                $currentUri = "$($u.Scheme)://$($u.Authority)/$location"
            }
            
            $Method = "GET"
            $Body = $null
            $redirectCount++
        } else {
            # Success response
            $content = $null
            try {
                $stream = $response.GetResponseStream()
                if ($stream) {
                    $reader = New-Object System.IO.StreamReader($stream)
                    $content = $reader.ReadToEnd()
                    $reader.Close()
                } else {
                    $content = $response.Content
                }
            } catch {
                $content = $response.Content
            }
            
            return [PSCustomObject]@{
                Content = $content
                StatusCode = $statusCode
                BaseURI = $currentUri
            }
        }
    }
    Write-Error "Too many redirects"
    return $null
}

Write-Host "1. Fetching login page..."
$loginPage = Fetch-WebPage -Uri $loginUrl -Session $session

# Extract ASP.NET variables
$html = $loginPage.Content
$viewstate = [regex]::Match($html, 'id="__VIEWSTATE" value="([^"]+)"').Groups[1].value
$viewstategenerator = [regex]::Match($html, 'id="__VIEWSTATEGENERATOR" value="([^"]+)"').Groups[1].value
$eventvalidation = [regex]::Match($html, 'id="__EVENTVALIDATION" value="([^"]+)"').Groups[1].value

Write-Host "ViewState length: $($viewstate.Length)"
Write-Host "ViewStateGenerator: $viewstategenerator"
Write-Host "EventValidation length: $($eventvalidation.Length)"

# Prepare form data
$body = @{
    "__EVENTTARGET" = "LoginUser`$LoginButton"
    "__EVENTARGUMENT" = ""
    "__VIEWSTATE" = $viewstate
    "__VIEWSTATEGENERATOR" = $viewstategenerator
    "__EVENTVALIDATION" = $eventvalidation
    "LoginUser`$UserName" = "ktv.nbtl"
    "LoginUser`$Password" = "nbtl@123"
}

Write-Host "`n2. Logging in via POST to $actionUrl..."
$homePage = Fetch-WebPage -Uri $actionUrl -Method POST -Body $body -Session $session

if ($homePage -and $homePage.Content) {
    Write-Host "`n3. Fetch Success!"
    Write-Host "Final URL: $($homePage.BaseURI)"
    
    # Save content
    $homePage.Content | Out-File -FilePath "$PSScriptRoot\home.html" -Encoding utf8
    Write-Host "Saved home page to $PSScriptRoot\home.html"
    
    if ($homePage.Content -match "<title>(.*?)</title>") {
        Write-Host "Page Title: $($Matches[1])"
    }

    # Extract all links
    Write-Host "`n4. Extracting menu links..."
    $links = [regex]::Matches($homePage.Content, 'href="([^"]+)"') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
    foreach ($link in $links) {
        if ($link -and -not $link.StartsWith("#") -and -not $link.StartsWith("javascript:")) {
            Write-Host "Link found: $link"
        }
    }
} else {
    Write-Host "Failed to get home page content."
}
