# .env.production 파일 확인 및 생성 스크립트

Write-Host "🔍 Checking .env.production file..." -ForegroundColor Cyan

$envFile = ".env.production"

if (Test-Path $envFile) {
    Write-Host "✅ File exists: $envFile" -ForegroundColor Green
    Write-Host "`n📄 Current file contents:" -ForegroundColor Yellow
    Get-Content $envFile
    
    $content = Get-Content $envFile -Raw
    $apiKeyLine = $content | Select-String "VITE_KAKAO_MAP_API_KEY=(.+)"
    
    if ($apiKeyLine) {
        $apiKey = $apiKeyLine.Matches.Groups[1].Value.Trim()
        Write-Host "`n📏 API Key Analysis:" -ForegroundColor Yellow
        Write-Host "  Length: $($apiKey.Length) characters"
        Write-Host "  First 10 chars: $($apiKey.Substring(0, [Math]::Min(10, $apiKey.Length)))"
        Write-Host "  Last 10 chars: $($apiKey.Substring([Math]::Max(0, $apiKey.Length - 10)))"
        
        if ($apiKey.Length -lt 30) {
            Write-Host "`n⚠️ WARNING: API Key is too short!" -ForegroundColor Red
            Write-Host "   Minimum 30 characters required, but found $($apiKey.Length)" -ForegroundColor Red
            Write-Host "   Please check your Kakao JavaScript API key." -ForegroundColor Red
        } elseif ($apiKey.Length -ge 30) {
            Write-Host "`n✅ API Key length is valid" -ForegroundColor Green
        }
    } else {
        Write-Host "`n⚠️ WARNING: VITE_KAKAO_MAP_API_KEY not found in file!" -ForegroundColor Red
    }
} else {
    Write-Host "❌ File does not exist: $envFile" -ForegroundColor Red
    Write-Host "`n📝 Creating new .env.production file..." -ForegroundColor Yellow
    
    $apiKey = Read-Host "Enter your Kakao JavaScript API Key"
$apiBaseUrl = Read-Host "Enter API Base URL (default: https://culturemap-api.fly.dev/api)" -Default "https://culturemap-api.fly.dev/api"
    
    @"
VITE_KAKAO_MAP_API_KEY=$apiKey
VITE_API_BASE_URL=$apiBaseUrl
"@ | Out-File -FilePath $envFile -Encoding utf8 -NoNewline
    
    Write-Host "`n✅ Created $envFile" -ForegroundColor Green
    Write-Host "📄 File contents:" -ForegroundColor Yellow
    Get-Content $envFile
}

Write-Host "`n💡 Tips:" -ForegroundColor Cyan
Write-Host "  - Make sure you're using JavaScript Key (not REST API Key)" -ForegroundColor Gray
Write-Host "  - Get it from: https://developers.kakao.com/ > 앱 키 > JavaScript 키" -ForegroundColor Gray
Write-Host "  - Register domain: https://developers.kakao.com/ > 앱 설정 > 플랫폼 > Web" -ForegroundColor Gray
