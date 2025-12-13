# Fix .env.production file by removing BOM and ensuring correct format

Write-Host "Fixing .env.production file..." -ForegroundColor Cyan
Write-Host ""

$envFile = ".env.production"

if (-not (Test-Path $envFile)) {
    Write-Host "ERROR: .env.production file not found!" -ForegroundColor Red
    exit 1
}

# Read file as bytes to check for BOM
$bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $envFile))
$hasBOM = $bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF

if ($hasBOM) {
    Write-Host "WARNING: File has UTF-8 BOM, removing it..." -ForegroundColor Yellow
    
    # Read content without BOM
    $content = Get-Content $envFile -Raw -Encoding UTF8
    
    # Extract values
    $apiKeyMatch = $content | Select-String "VITE_KAKAO_MAP_API_KEY=(.+)"
    $apiUrlMatch = $content | Select-String "VITE_API_BASE_URL=(.+)"
    
    if (-not $apiKeyMatch) {
        Write-Host "ERROR: Could not find VITE_KAKAO_MAP_API_KEY in file!" -ForegroundColor Red
        exit 1
    }
    
    $apiKey = $apiKeyMatch.Matches.Groups[1].Value.Trim()
    $apiUrl = if ($apiUrlMatch) { $apiUrlMatch.Matches.Groups[1].Value.Trim() } else { "https://culturemap-api.fly.dev/api" }
    
    # Write file without BOM
    $newContent = "VITE_KAKAO_MAP_API_KEY=$apiKey`nVITE_API_BASE_URL=$apiUrl"
    [System.IO.File]::WriteAllText((Resolve-Path $envFile), $newContent, [System.Text.UTF8Encoding]::new($false))
    
    Write-Host "Fixed: Removed BOM and recreated file" -ForegroundColor Green
} else {
    Write-Host "File does not have BOM, checking format..." -ForegroundColor Gray
    
    $content = Get-Content $envFile -Raw
    $apiKeyMatch = $content | Select-String "VITE_KAKAO_MAP_API_KEY=(.+)"
    
    $apiUrlMatch = $content | Select-String "VITE_API_BASE_URL=(.+)"
    if ($apiKeyMatch) {
        $apiKey = $apiKeyMatch.Matches.Groups[1].Value.Trim()
        Write-Host "API Key found, length: $($apiKey.Length)" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Could not extract API key, recreating file..." -ForegroundColor Yellow
    }
    if ($apiUrlMatch) {
        $apiUrl = $apiUrlMatch.Matches.Groups[1].Value.Trim()
        Write-Host "API Base URL: $apiUrl" -ForegroundColor Gray
    } else {
        Write-Host "WARNING: VITE_API_BASE_URL not found (expected https://culturemap-api.fly.dev/api)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Verifying fixed file..." -ForegroundColor Cyan
$finalContent = Get-Content $envFile -Raw
$finalKeyMatch = $finalContent | Select-String "VITE_KAKAO_MAP_API_KEY=(.+)"
if ($finalKeyMatch) {
    $finalKey = $finalKeyMatch.Matches.Groups[1].Value.Trim()
    Write-Host "API Key: $($finalKey.Substring(0, [Math]::Min(10, $finalKey.Length)))..." -ForegroundColor Gray
    Write-Host "Length: $($finalKey.Length) characters" -ForegroundColor Gray
    if ($finalKey.Length -ge 30) {
        Write-Host "File is ready for deployment!" -ForegroundColor Green
    } else {
        Write-Host "WARNING: API Key is too short!" -ForegroundColor Red
    }
} else {
    Write-Host "ERROR: Still could not extract API key!" -ForegroundColor Red
    exit 1
}
