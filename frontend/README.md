# 컬처맵 프론트엔드

## 환경 설정

### 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```
VITE_KAKAO_MAP_API_KEY=your_kakao_map_api_key_here
```

Kakao 지도 API 키는 [Kakao Developers](https://developers.kakao.com/)에서 발급받을 수 있습니다.

### 2. 패키지 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173`으로 접속하세요.

## 주요 기능

- 회원가입/로그인 (JWT 인증)
- 플랜 생성/수정/삭제
- 장소 검색 및 추가
- 달력 기반 날짜 필터링
- Kakao 지도 연동 (장소 마커 표시)
- 플랜 공유 게시판

## 기술 스택

- React 19
- TypeScript
- React Router
- Axios
- react-kakao-maps-sdk
- Litepicker (달력)
