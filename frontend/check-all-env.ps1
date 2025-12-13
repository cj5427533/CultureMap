# Check all .env files for conflicts

Write-Host "Checking all environment files for conflicts..." -ForegroundColor Cyan
Write-Host ""

$files = @(".env", ".env.local", ".env.production", ".env.production.local")

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Found: $file" -ForegroundColor Yellow
        $content = Get-Content $file -Raw
        
        $kakaoKey = $content | Select-String "VITE_KAKAO_MAP_API_KEY=(.+)"
        $apiUrl = $content | Select-String "VITE_API_BASE_URL=(.+)"
        
        if ($kakaoKey) {
            $key = $kakaoKey.Matches.Groups[1].Value.Trim()
            Write-Host "  VITE_KAKAO_MAP_API_KEY: $($key.Substring(0, [Math]::Min(10, $key.Length)))... (length: $($key.Length))" -ForegroundColor $(if ($key.Length -ge 30) { "Green" } else { "Red" })
        } else {
            Write-Host "  VITE_KAKAO_MAP_API_KEY: not found" -ForegroundColor Gray
        }
        
        if ($apiUrl) {
            $url = $apiUrl.Matches.Groups[1].Value.Trim()
            Write-Host "  VITE_API_BASE_URL: $url" -ForegroundColor Gray
        }
        
        Write-Host ""
    }
}

Write-Host "Recommendations:" -ForegroundColor Cyan
Write-Host "1. .env.production should have the correct API key" -ForegroundColor Gray
Write-Host "2. .env file should NOT have VITE_KAKAO_MAP_API_KEY (or should be removed)" -ForegroundColor Gray
Write-Host "3. For production build, only .env.production is used" -ForegroundColor Gray
Write-Host "4. VITE_API_BASE_URL should point to backend (e.g., https://culturemap-api.fly.dev/api)" -ForegroundColor Gray
