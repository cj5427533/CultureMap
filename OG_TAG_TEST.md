# OG 태그 미리보기 테스트 방법

카카오톡, 페이스북 등 SNS에서 공유 링크의 미리보기를 확인하는 방법입니다.

## 1. 카카오톡 링크 미리보기 테스터

**URL**: https://developers.kakao.com/tool/clear/og

1. 위 링크에 접속
2. "URL 입력" 필드에 테스트할 게시글 URL 입력 (예: `http://localhost:5173/posts/1`)
3. "요청" 버튼 클릭
4. OG 태그 정보와 미리보기 이미지 확인

**주의사항**:
- 로컬호스트(`localhost`)는 카카오톡에서 접근할 수 없으므로, 실제 배포된 도메인으로 테스트해야 합니다.
- 개발 중이라면 ngrok 같은 터널링 서비스를 사용하거나, 실제 배포 환경에서 테스트하세요.

## 2. Facebook Sharing Debugger

**URL**: https://developers.facebook.com/tools/debug/

1. 위 링크에 접속
2. "Scrape Again" 버튼 클릭 전에 URL 입력 필드에 테스트할 URL 입력
3. "Scrape Again" 버튼 클릭
4. OG 태그 정보와 미리보기 확인

## 3. Twitter Card Validator

**URL**: https://cards-dev.twitter.com/validator

1. 위 링크에 접속
2. URL 입력 후 미리보기 확인

## 4. 실제 카카오톡에서 테스트

1. 카카오톡 앱 열기
2. 채팅방에서 링크 공유
3. 링크 입력 후 전송
4. 카드 형태로 미리보기 표시 확인

**중요**: 
- 로컬호스트는 카카오톡에서 접근 불가
- 실제 도메인 또는 ngrok 같은 터널링 서비스 필요
- HTTPS가 권장됨 (일부 SNS는 HTTP 링크를 차단할 수 있음)

## 5. 개발 환경에서 테스트하는 방법

### ngrok 사용 (권장)

```bash
# ngrok 설치 후
ngrok http 5173  # 프론트엔드 포트
# 또는
ngrok http 8080  # 백엔드 포트
```

ngrok이 제공하는 공개 URL을 사용하여 위의 테스터 도구에서 테스트할 수 있습니다.

## 현재 구현된 OG 태그

- `og:title`: 게시글 제목
- `og:description`: 게시글 설명 또는 플랜 날짜
- `og:url`: 게시글 URL
- `og:type`: article
- `og:image`: 첫 번째 장소의 카카오 지도 정적 이미지 (위도/경도가 있는 경우)

## 문제 해결

OG 태그가 보이지 않는 경우:

1. **캐시 문제**: SNS 플랫폼은 OG 태그를 캐시합니다. 테스터 도구에서 "새로고침" 또는 "Scrape Again"을 클릭하세요.

2. **도메인 접근 불가**: 로컬호스트는 외부에서 접근할 수 없습니다. 실제 도메인 또는 터널링 서비스 사용 필요.

3. **HTTPS 필요**: 일부 SNS는 HTTP 링크를 차단할 수 있습니다.

4. **OG 이미지 URL**: 이미지 URL이 유효하고 접근 가능해야 합니다. 카카오 지도 정적 이미지 API는 API 키가 필요할 수 있습니다.
