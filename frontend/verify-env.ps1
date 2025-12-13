# .env.production file verification script

Write-Host "Verifying .env.production file for deployment..." -ForegroundColor Cyan
Write-Host ""

$envFile = ".env.production"

if (-not (Test-Path $envFile)) {
    Write-Host "ERROR: .env.production file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create the file with:" -ForegroundColor Yellow
    Write-Host '  @"' -ForegroundColor Gray
    Write-Host 'VITE_KAKAO_MAP_API_KEY=your_key_here' -ForegroundColor Gray
    Write-Host 'VITE_API_BASE_URL=https://culturemap-api.fly.dev/api' -ForegroundColor Gray
    Write-Host '"@ | Out-File -FilePath .env.production -Encoding utf8 -NoNewline' -ForegroundColor Gray
    exit 1
}

Write-Host "File exists: $envFile" -ForegroundColor Green
Write-Host ""

# Read file content
$content = Get-Content $envFile -Raw

# Extract API key
$apiKeyMatch = $content | Select-String "VITE_KAKAO_MAP_API_KEY=(.+)"
if (-not $apiKeyMatch) {
    Write-Host "ERROR: VITE_KAKAO_MAP_API_KEY not found in file!" -ForegroundColor Red
    Write-Host ""
    Write-Host "File contents:" -ForegroundColor Yellow
    Get-Content $envFile
    exit 1
}

$apiKey = $apiKeyMatch.Matches.Groups[1].Value.Trim()

# Extract API Base URL
$apiUrlMatch = $content | Select-String "VITE_API_BASE_URL=(.+)"
$apiUrl = if ($apiUrlMatch) { $apiUrlMatch.Matches.Groups[1].Value.Trim() } else { "not set" }

Write-Host "File Contents:" -ForegroundColor Yellow
Write-Host "  VITE_KAKAO_MAP_API_KEY=$($apiKey.Substring(0, [Math]::Min(10, $apiKey.Length)))..." -ForegroundColor Gray
Write-Host "  VITE_API_BASE_URL=$apiUrl" -ForegroundColor Gray
Write-Host ""

Write-Host "Validation:" -ForegroundColor Yellow

# Length validation
if ($apiKey.Length -lt 30) {
    Write-Host "  ERROR: API Key length: $($apiKey.Length) (minimum 30 required)" -ForegroundColor Red
    Write-Host "  ERROR: API Key is too short!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  1. You're using JavaScript Key (not REST API Key)" -ForegroundColor Gray
    Write-Host "  2. Key is from: https://developers.kakao.com/ > App Key > JavaScript Key" -ForegroundColor Gray
    Write-Host "  3. No spaces or quotes around the key value" -ForegroundColor Gray
    exit 1
} else {
    Write-Host "  OK: API Key length: $($apiKey.Length) characters" -ForegroundColor Green
}

# Format validation (hex characters only)
if ($apiKey -match '^[0-9a-fA-F]{30,}$') {
    Write-Host "  OK: API Key format looks valid" -ForegroundColor Green
} else {
    Write-Host "  WARNING: API Key format may be invalid (should be hex characters)" -ForegroundColor Yellow
}

Write-Host ""

# File encoding check
$fileBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $envFile))
$hasBOM = $fileBytes[0] -eq 0xEF -and $fileBytes[1] -eq 0xBB -and $fileBytes[2] -eq 0xBF
if ($hasBOM) {
    Write-Host "  WARNING: File has UTF-8 BOM (may cause issues)" -ForegroundColor Yellow
} else {
    Write-Host "  OK: File encoding looks good" -ForegroundColor Green
}

Write-Host ""
Write-Host "File validation passed! Ready for deployment." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Make sure domain is registered in Kakao Developers:" -ForegroundColor Gray
Write-Host "     https://developers.kakao.com/ > App Settings > Platform > Web" -ForegroundColor Gray
Write-Host "     Add: https://culturemap.fly.dev" -ForegroundColor Gray
Write-Host "  2. Deploy with: fly deploy" -ForegroundColor Gray
