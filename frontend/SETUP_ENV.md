# 환경변수 설정 가이드

## 문제: "API 키가 올바르지 않습니다" 에러

이 에러는 빌드 시 `VITE_KAKAO_MAP_API_KEY` 환경변수가 제대로 전달되지 않았을 때 발생합니다.

## 해결 방법

### 방법 1: 빌드 인자로 전달 (배포 명령 한 번에 해결)

```powershell
# frontend 디렉토리에서 실행
cd frontend

# 로컬 환경변수에 JS 키를 먼저 넣어두면 편합니다
$env:VITE_KAKAO_MAP_API_KEY="<당신의 Kakao JavaScript 키>"

# 배포 (API Base URL 함께 전달)
fly deploy --build-arg VITE_KAKAO_MAP_API_KEY=$env:VITE_KAKAO_MAP_API_KEY --build-arg VITE_API_BASE_URL=https://culturemap-api.fly.dev/api
```

**중요**
- Kakao Developers > 앱 키 > **JavaScript 키**를 사용하세요 (REST 키 X)
- 키 길이가 보통 32자 이상이며, 앞뒤 공백/따옴표 없이 그대로 입력합니다
- Fly secrets는 Vite 빌드에 주입되지 않으므로 build-arg 또는 .env.production이 필요합니다

### 방법 2: .env.production 파일 생성

#### 자동 스크립트 사용

```powershell
# frontend 디렉토리에서 실행
cd frontend
.\check-env.ps1          # 없으면 생성, 있으면 길이/형식 확인
```

#### 수동 생성

```powershell
# frontend 디렉토리에서 실행
cd frontend

@"
VITE_KAKAO_MAP_API_KEY=<당신의 Kakao JavaScript 키>
VITE_API_BASE_URL=https://culturemap-api.fly.dev/api
"@ | Out-File -FilePath .env.production -Encoding utf8 -NoNewline

# 검증
.\verify-env.ps1

# 배포
fly deploy
```

**파일 작성 시 유의사항**
- `-NoNewline`으로 불필요한 개행을 막습니다
- 키 앞뒤 공백/따옴표 없이 작성합니다
- JavaScript 키인지 다시 확인합니다

### 방법 3: Fly.io Secrets 사용 (런타임 환경변수)

Fly.io secrets는 **런타임** 환경변수이므로, Vite 빌드 시에는 사용할 수 없습니다.
Vite는 **빌드 타임**에 환경변수를 번들에 포함시키므로, 빌드 인자나 `.env.production` 파일이 필요합니다.

## Kakao Developers 콘솔 설정 확인

1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 애플리케이션 선택
3. **앱 설정 > 플랫폼** 메뉴
4. **Web 플랫폼 등록**에 다음 도메인 추가:
   - `https://culturemap.fly.dev`
   - `http://localhost:5173` (개발용)
5. **앱 키** 메뉴에서 **JavaScript 키** 확인

## API 키 확인 방법

브라우저 콘솔(F12)에서 다음을 확인하세요:

```javascript
// 콘솔에서 실행
console.log('API 키:', import.meta.env.VITE_KAKAO_MAP_API_KEY);
console.log('API 키 길이:', import.meta.env.VITE_KAKAO_MAP_API_KEY?.length);
```

- `undefined`이면 빌드 시 환경변수가 전달되지 않은 것입니다
- 길이가 30자 미만이면 잘못된 키를 사용하고 있는 것입니다
- JavaScript 키는 보통 32자 이상입니다

## 배포 후 확인

배포 후 브라우저 콘솔에서 다음을 확인:

1. Network 탭에서 `sdk.js?appkey=...` 요청 확인
2. 401 에러가 나면:
   - 도메인이 Kakao Developers 콘솔에 등록되었는지 확인
   - JavaScript 키를 사용하고 있는지 확인
3. API 키가 `undefined`이면:
   - 빌드 시 환경변수가 전달되지 않은 것입니다
   - `.env.production` 파일을 생성하거나 빌드 인자로 전달하세요
