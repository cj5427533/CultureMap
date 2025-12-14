# CultureMap 데이터베이스 덤프 생성 스크립트
# 사용법: .\scripts\dump-db.ps1 [-Mode dev|prod] [-OutputPath <경로>]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "prod")]
    [string]$Mode = "dev",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputPath = ""
)

# 스크립트 디렉토리로 이동
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

# 덤프 파일 저장 경로 설정
if ([string]::IsNullOrEmpty($OutputPath)) {
    $OutputPath = Join-Path $ProjectRoot "database"
}

# 출력 디렉토리가 없으면 생성
if (-not (Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
}

# 타임스탬프 생성
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$DumpFileName = "culturemap_dump_${Mode}_${Timestamp}.sql"
$DumpFilePath = Join-Path $OutputPath $DumpFileName

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "CultureMap 데이터베이스 덤프 생성" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "모드: $Mode" -ForegroundColor Yellow
Write-Host "출력 경로: $DumpFilePath" -ForegroundColor Yellow
Write-Host ""

# 모드에 따른 설정
if ($Mode -eq "dev") {
    $ContainerName = "culturemap-mysql-dev"
    $DBName = "culturemap"
    $DBUser = "root"
    $DBPassword = "1234"
    $HostPort = "3309"
} else {
    $ContainerName = "culturemap-mysql"
    $DBName = "culturemap"
    $DBUser = "root"
    # 프로덕션 모드에서는 환경변수에서 비밀번호 가져오기
    $DBPassword = $env:DB_PASSWORD
    if ([string]::IsNullOrEmpty($DBPassword)) {
        $DBPassword = "rootpassword"
        Write-Host "경고: DB_PASSWORD 환경변수가 설정되지 않아 기본값을 사용합니다." -ForegroundColor Yellow
    }
    $HostPort = "3306"
}

# Docker 컨테이너 확인
$ContainerExists = docker ps -a --filter "name=$ContainerName" --format "{{.Names}}" | Select-String -Pattern $ContainerName

if ($ContainerExists) {
    $ContainerRunning = docker ps --filter "name=$ContainerName" --format "{{.Names}}" | Select-String -Pattern $ContainerName
    
    if ($ContainerRunning) {
        Write-Host "Docker 컨테이너에서 덤프 생성 중..." -ForegroundColor Green
        
        # Docker 컨테이너 내부에서 mysqldump 실행
        $DumpCommand = "mysqldump -u$DBUser -p$DBPassword --single-transaction --routines --triggers --events $DBName"
        
        try {
            docker exec $ContainerName sh -c $DumpCommand | Out-File -FilePath $DumpFilePath -Encoding UTF8
            
            if ($LASTEXITCODE -eq 0) {
                $FileSize = (Get-Item $DumpFilePath).Length / 1KB
                Write-Host "✓ 덤프 파일 생성 완료!" -ForegroundColor Green
                Write-Host "  파일: $DumpFilePath" -ForegroundColor White
                Write-Host "  크기: $([math]::Round($FileSize, 2)) KB" -ForegroundColor White
            } else {
                Write-Host "✗ 덤프 생성 실패 (종료 코드: $LASTEXITCODE)" -ForegroundColor Red
                if (Test-Path $DumpFilePath) {
                    Remove-Item $DumpFilePath -Force
                }
                exit 1
            }
        } catch {
            Write-Host "✗ 오류 발생: $_" -ForegroundColor Red
            if (Test-Path $DumpFilePath) {
                Remove-Item $DumpFilePath -Force
            }
            exit 1
        }
    } else {
        Write-Host "컨테이너가 실행 중이 아닙니다. 로컬 MySQL로 시도합니다..." -ForegroundColor Yellow
        
        # 로컬 MySQL 연결 시도
        $LocalDumpCommand = "mysqldump -h 127.0.0.1 -P $HostPort -u$DBUser -p$DBPassword --single-transaction --routines --triggers --events $DBName"
        
        try {
            # PowerShell에서 비밀번호를 안전하게 전달하기 위해 환경변수 사용
            $env:MYSQL_PWD = $DBPassword
            & mysqldump -h 127.0.0.1 -P $HostPort -u$DBUser --single-transaction --routines --triggers --events $DBName | Out-File -FilePath $DumpFilePath -Encoding UTF8
            Remove-Item Env:\MYSQL_PWD
            
            if ($LASTEXITCODE -eq 0) {
                $FileSize = (Get-Item $DumpFilePath).Length / 1KB
                Write-Host "✓ 덤프 파일 생성 완료!" -ForegroundColor Green
                Write-Host "  파일: $DumpFilePath" -ForegroundColor White
                Write-Host "  크기: $([math]::Round($FileSize, 2)) KB" -ForegroundColor White
            } else {
                Write-Host "✗ 덤프 생성 실패 (종료 코드: $LASTEXITCODE)" -ForegroundColor Red
                Write-Host "  mysqldump가 설치되어 있고 PATH에 포함되어 있는지 확인하세요." -ForegroundColor Yellow
                if (Test-Path $DumpFilePath) {
                    Remove-Item $DumpFilePath -Force
                }
                exit 1
            }
        } catch {
            Write-Host "✗ 오류 발생: $_" -ForegroundColor Red
            Write-Host "  mysqldump가 설치되어 있고 PATH에 포함되어 있는지 확인하세요." -ForegroundColor Yellow
            if (Test-Path $DumpFilePath) {
                Remove-Item $DumpFilePath -Force
            }
            exit 1
        }
    }
} else {
    Write-Host "컨테이너를 찾을 수 없습니다. 로컬 MySQL로 시도합니다..." -ForegroundColor Yellow
    
    # 로컬 MySQL 연결 시도
    try {
        $env:MYSQL_PWD = $DBPassword
        & mysqldump -h 127.0.0.1 -P $HostPort -u$DBUser --single-transaction --routines --triggers --events $DBName | Out-File -FilePath $DumpFilePath -Encoding UTF8
        Remove-Item Env:\MYSQL_PWD
        
        if ($LASTEXITCODE -eq 0) {
            $FileSize = (Get-Item $DumpFilePath).Length / 1KB
            Write-Host "✓ 덤프 파일 생성 완료!" -ForegroundColor Green
            Write-Host "  파일: $DumpFilePath" -ForegroundColor White
            Write-Host "  크기: $([math]::Round($FileSize, 2)) KB" -ForegroundColor White
        } else {
            Write-Host "✗ 덤프 생성 실패 (종료 코드: $LASTEXITCODE)" -ForegroundColor Red
            Write-Host "  mysqldump가 설치되어 있고 PATH에 포함되어 있는지 확인하세요." -ForegroundColor Yellow
            if (Test-Path $DumpFilePath) {
                Remove-Item $DumpFilePath -Force
            }
            exit 1
        }
    } catch {
        Write-Host "✗ 오류 발생: $_" -ForegroundColor Red
        Write-Host "  mysqldump가 설치되어 있고 PATH에 포함되어 있는지 확인하세요." -ForegroundColor Yellow
        Write-Host "  또는 Docker 컨테이너를 먼저 실행하세요:" -ForegroundColor Yellow
        if ($Mode -eq "dev") {
            Write-Host "    docker-compose -f docker/docker-compose.dev.yml up -d" -ForegroundColor Cyan
        } else {
            Write-Host "    docker-compose -f docker/docker-compose.yml up -d" -ForegroundColor Cyan
        }
        if (Test-Path $DumpFilePath) {
            Remove-Item $DumpFilePath -Force
        }
        exit 1
    }
}

Write-Host ""
Write-Host "덤프 파일이 성공적으로 생성되었습니다!" -ForegroundColor Green
