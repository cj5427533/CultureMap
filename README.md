# 컬처맵 (CultureMap) 🗺️

> **나의 문화 일정을 계획하고, 기록하고, 공유한다.**

컬처맵은 사용자가 스스로 계획한 문화 생활 플랜을 기록하고, 일부를 다른 사람과 공유할 수 있는 커뮤니티 기반 문화기록 플랫폼입니다.

## 📋 목차

- [서비스 소개](#서비스-소개)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [시작하기](#시작하기)
- [환경 설정](#환경-설정)
- [API 엔드포인트](#api-엔드포인트)
- [데이터 출처](#데이터-출처)

---

## 🎯 서비스 소개

컬처맵은 단순한 전시 일정 공유를 넘어서, 사용자 스스로 설계한 문화 생활 플랜을 커뮤니티로 확산시키는 플랫폼을 지향합니다.

### 핵심 가치
- **계획**: 문화시설을 조합해 나만의 플랜 생성
- **기록**: 날짜별로 플랜을 체계적으로 관리
- **공유**: 좋은 플랜을 커뮤니티와 나누기

---

## 🧩 주요 기능

| 기능 | 설명 |
|------|------|
| 문화 플랜 생성 | 사용자가 직접 전시/공연 등 장소를 조합해 플랜을 생성 (날짜 기반) |
| 플랜 협업 | 플랜 소유자가 다른 사용자를 초대하여 함께 플랜 관리 (EDITOR/VIEWER 권한) |
| 경로 설정 | Kakao Mobility Directions API를 통한 자동차 경로 조회 및 지도 표시 |
| 플랜 공유 | 개인 플랜 중 일부를 게시글로 공유 (Plan → PlanPost 참조 방식) |
| 게시판 열람 | 공유된 플랜들을 전체 공개 게시판에서 확인 가능 |
| 댓글 및 별점 | 게시글에 댓글 작성 및 별점 평가 (댓글과 함께 별점 제출) |
| 장소 검색 | Kakao Local API 기반 주변 문화시설 검색 기능 (디바운스 적용) |
| 검색 최적화 | 검색 결과 캐싱, 최근 검색 기록, 인기 장소 추천 |
| 달력 필터링 | 월별 달력 UI에서 날짜 클릭 시 해당 날짜의 플랜 필터링 |
| 회원가입/로그인 | JWT 기반 로그인 (리프레시 토큰 자동 재발급) |
| 지도 기반 탐색 | 현위치 기반 지도에서 주변 문화시설 검색 및 플랜 추가 |
| 관리자 대시보드 | 시스템 통계 및 API 사용량 모니터링 (관리자 전용) |

---

## 💻 기술 스택

### 백엔드
- **프레임워크**: Spring Boot 4.0.0
- **언어**: Java 17
- **ORM**: Spring Data JPA + Hibernate
- **인증**: Spring Security + JWT
- **빌드도구**: Gradle
- **DB**:
  - 개발: H2 (인메모리)
  - 운영: MySQL
- **API 문서화**: springdoc-openapi + Swagger UI
- **외부 API 연동**: 
  - Kakao Local API (주변 문화시설 검색)
  - Kakao Mobility Directions API (자동차 경로 조회)
  - 한국문화정보원 문화시설 API (향후 구현)
- **성능 최적화**:
  - JPA N+1 문제 해결 (@EntityGraph, fetch join)
  - 데이터베이스 인덱스 최적화
  - 검색 결과 캐싱 (인메모리)
  - 레이트 리밋 (로그인 시도, API 호출 제한)

### 프론트엔드
- **프레임워크**: React 19.2.0 + TypeScript 5.9.3
- **빌드 도구**: Vite 7.2.4
- **스타일링**: Tailwind CSS 3.4.0
- **라우팅**: React Router DOM 6.26.0
- **HTTP 클라이언트**: Axios 1.7.7
- **지도**: react-kakao-maps-sdk 1.1.7
- **달력**: Litepicker 2.0.12
- **UX 최적화**:
  - 검색 디바운스 (500ms)
  - 글로벌 로딩 상태 표시
  - Error Boundary를 통한 에러 처리
- **UX 최적화**:
  - 검색 디바운스 (500ms)
  - 글로벌 로딩 상태 표시
  - Error Boundary를 통한 에러 처리

---

## 📁 프로젝트 구조

```
culturemap/
├── src/main/java/com/culturemap/    # 백엔드 소스 코드
│   ├── config/                      # 설정 클래스 (Security, Swagger 등)
│   ├── controller/                  # REST API 컨트롤러
│   ├── domain/                       # JPA 엔티티 (Member, Plan, Place 등)
│   ├── dto/                         # 데이터 전송 객체
│   ├── exception/                   # 예외 처리
│   ├── repository/                  # JPA 리포지토리
│   ├── security/                     # JWT 인증 관련
│   └── service/                      # 비즈니스 로직
├── src/main/resources/
│   └── application.properties       # 애플리케이션 설정
└── frontend/                        # React 프론트엔드
    ├── src/
    │   ├── components/              # React 컴포넌트
    │   ├── pages/                   # 페이지 컴포넌트
    │   ├── services/                # API 서비스
    │   ├── hooks/                   # 커스텀 훅
    │   ├── types/                   # TypeScript 타입 정의
    │   └── utils/                   # 유틸리티 함수
    └── public/                      # 정적 파일
```

### 도메인 모델

- **Member**: 회원 정보 (이메일, 닉네임, 비밀번호, 역할)
- **Plan**: 사용자의 문화 생활 플랜 (날짜, 제목, 장소 리스트)
- **PlanPlace**: 플랜과 장소의 연결 테이블 (방문 순서, 시간)
- **PlanMember**: 플랜 협업 멤버 (OWNER, EDITOR, VIEWER 권한)
- **Place**: 문화시설 정보 (이름, 주소, 좌표, 카테고리)
- **PlanPost**: 공유 게시글 (플랜 참조, 제목, 설명, 평균 별점)
- **Comment**: 댓글 (게시글 참조, 내용, 별점 포함)
- **Rating**: 별점 (게시글 참조, 1~5점)
- **RefreshToken**: 리프레시 토큰 (자동 재발급용)
- **History**: 사용자 히스토리 이미지 (관리자 전용)

---

## 🚀 시작하기

### 사전 요구사항

- Java 17 이상
- Node.js 18 이상
- npm 또는 yarn
- Gradle (또는 Gradle Wrapper 사용)

### 설치 및 실행

#### 1. 저장소 클론
```bash
git clone <repository-url>
cd culturemap
```

#### 2. 백엔드 실행

```bash
# Gradle Wrapper를 사용하여 실행 (Windows)
.\gradlew bootRun

# 또는 (Linux/Mac)
./gradlew bootRun
```

백엔드는 기본적으로 `http://localhost:8080`에서 실행됩니다.

#### 3. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

프론트엔드는 기본적으로 `http://localhost:5173`에서 실행됩니다.

#### 4. API 문서 확인

Swagger UI를 통해 API 문서를 확인할 수 있습니다:
- URL: `http://localhost:8080/swagger-ui.html`

---

## ⚙️ 환경 설정

### 백엔드 설정 (`application.properties`)

```properties
# 데이터베이스 (H2 - 개발용)
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.username=sa
spring.datasource.password=

# JWT 설정
jwt.secret=your-secret-key-here
jwt.expiration=86400000  # 24시간 (Access Token)
jwt.refresh-expiration=604800000  # 7일 (Refresh Token)

# CORS 설정
cors.allowed-origins=http://localhost:3000,http://localhost:5173

# Kakao API 키
kakao.rest-api-key=your-kakao-rest-api-key
kakao.mobility.url=https://apis-navi.kakaomobility.com/v1/directions
```

### 프론트엔드 설정

프론트엔드는 `src/utils/api.ts`에서 API 기본 URL을 설정합니다:
```typescript
const API_BASE_URL = 'http://localhost:8080/api';
```

### Kakao API 키 발급

1. [Kakao Developers](https://developers.kakao.com/)에 접속
2. 애플리케이션 생성
3. REST API 키 발급
4. `application.properties`에 `kakao.rest-api-key` 설정

---

## 📡 API 엔드포인트

### 인증 (Auth)
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/refresh` - Access Token 재발급 (Refresh Token 사용)

### 플랜 (Plan)
- `POST /api/plans` - 플랜 생성 (인증 필요)
- `GET /api/plans` - 내 플랜 목록 조회 (인증 필요)
- `GET /api/plans/{id}` - 플랜 상세 조회 (인증 필요, 소유자/협업 멤버만)
- `PUT /api/plans/{id}` - 플랜 수정 (인증 필요, 소유자/EDITOR만)
- `DELETE /api/plans/{id}` - 플랜 삭제 (인증 필요, 소유자만)
- `POST /api/plans/add-place` - 플랜에 장소 추가 (인증 필요)
- `POST /api/plans/invite` - 플랜 멤버 초대 (인증 필요, 소유자만)
- `GET /api/plans/shared` - 공유받은 플랜 목록 조회 (인증 필요)

### 장소 (Place)
- `GET /api/places` - 장소 검색 (키워드 필터링, 캐싱 적용, 인증 필요)
- `GET /api/places/{id}` - 장소 상세 조회 (인증 필요)
- `POST /api/places` - 장소 생성 (인증 필요)
- `GET /api/places/kakao/nearby` - 주변 문화시설 검색 (공개, 프록시, 레이트 리밋)
- `GET /api/places/popular` - 인기 장소 조회 (캐싱 적용)
- `GET /api/places/recent-searches` - 최근 검색 키워드 조회 (인증 필요)

### 게시글 (PlanPost)
- `POST /api/posts` - 게시글 생성 (인증 필요)
- `GET /api/posts` - 전체 게시글 목록 조회 (공개)
- `GET /api/posts/{id}` - 게시글 상세 조회 (공개, OG 태그 포함)
- `PUT /api/posts/{id}` - 게시글 수정 (인증 필요, 작성자/관리자만)
- `DELETE /api/posts/{id}` - 게시글 삭제 (인증 필요, 작성자/관리자만)

### 댓글 및 별점 (Comment & Rating)
- `POST /api/comments` - 댓글 작성 (인증 필요, 별점 포함 가능)
- `GET /api/comments?postId={id}` - 게시글 댓글 목록 조회 (공개)
- `PUT /api/comments/{id}` - 댓글 수정 (인증 필요, 작성자만)
- `DELETE /api/comments/{id}` - 댓글 삭제 (인증 필요, 작성자만)

### 경로 (Directions)
- `GET /api/directions` - 자동차 경로 조회 (인증 필요, Kakao Mobility API 프록시, 레이트 리밋 및 캐싱)

### 관리자 (Admin)
- `GET /api/admin/stats` - 시스템 통계 조회 (관리자만, 사용자/게시글/플랜 수, API 사용량)

> 💡 자세한 API 문서는 Swagger UI (`http://localhost:8080/swagger-ui.html`)에서 확인할 수 있습니다.

---

## 📊 데이터 출처

- **한국문화정보원 문화시설 정보 OpenAPI**
  - URL: https://www.data.go.kr/data/15000804/openapi.do
  - 조건: 비상업적 목적의 무료 사용 (시연/발표용)

---

## 🎨 주요 기능 상세

### 플랜 생성 플로우
1. **날짜 선택**: 달력에서 방문 날짜 선택
2. **플랜 이름 설정**: 플랜 이름 입력
3. **플랜 생성**: 빈 플랜 생성 (장소는 나중에 추가 가능)
4. **장소 추가**: 지도에서 문화시설 검색 후 플랜에 추가

### 지도에서 장소 추가
1. 지도에서 문화시설 마커 클릭
2. 방문 날짜 선택
3. 해당 날짜의 플랜 확인/선택
4. 방문 시간 선택 (선택사항)
5. 플랜에 장소 추가 완료

---

## 🔐 보안

- **JWT 기반 인증**: Stateless 인증 방식
  - Access Token (24시간) + Refresh Token (7일)
  - 자동 토큰 재발급 (401 에러 시)
- **비밀번호 암호화**: BCrypt 알고리즘 사용
- **레이트 리밋**: 
  - 로그인 시도 제한 (IP:이메일 기준, 5분에 5회)
  - 검색 API 호출 제한 (IP 기준, 1분에 30회)
- **CORS 설정**: 허용된 Origin만 접근 가능
- **권한 검증**: 
  - 리소스 소유자 또는 협업 멤버만 수정/삭제 가능
  - 관리자 권한 (ADMIN)으로 모든 리소스 관리 가능
- **API 키 보호**: 외부 API 호출은 백엔드 프록시를 통해 처리

---

## 📝 구현된 기능

### 핵심 기능
- ✅ 회원가입/로그인 (JWT + 리프레시 토큰)
- ✅ 플랜 생성/수정/삭제 (날짜 + 장소 리스트)
- ✅ 플랜 협업 (멤버 초대, 권한 관리)
- ✅ Plan → 공유 게시글 등록
- ✅ 공유 게시판 열람
- ✅ 댓글 및 별점 기능 (댓글과 함께 별점 제출)
- ✅ Kakao Local API 연동 (장소 선택)
- ✅ Kakao Mobility Directions API 연동 (자동차 경로 조회)
- ✅ 달력 UI 기반 필터링
- ✅ 지도 기반 주변 문화시설 검색
- ✅ 검색 디바운스 및 결과 캐싱
- ✅ 관리자 모니터링 대시보드

### 성능 최적화
- ✅ JPA N+1 문제 해결 (@EntityGraph, fetch join)
- ✅ 데이터베이스 인덱스 최적화
- ✅ 검색 결과 캐싱 (인메모리, 10분 TTL)
- ✅ 인기 장소 캐싱 (1시간 TTL)
- ✅ 최근 검색 기록 저장
- ✅ 글로벌 로딩/에러 상태 관리

### 보안 및 안정성
- ✅ 리프레시 토큰 자동 재발급
- ✅ 레이트 리밋 (로그인 시도, API 호출 제한)
- ✅ 관리자 권한 관리
- ✅ Error Boundary (프론트엔드)

### 향후 확장 고려
- 플랜 카테고리: 데이트/주말나들이/혼자놀기 등 분류
- 공유 범위 설정: 비공개/팔로워만 등
- 신고/차단 기능
- OAuth 로그인 (카카오, 구글)
- 비밀번호 재설정
- 이메일 검증

---

## 📄 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

---

## 👥 기여

프로젝트 개선을 위한 제안과 기여를 환영합니다!

---

**작성일**: 2024년  
**최종 업데이트**: 2025년 12월  
**프로젝트 버전**: v2.0
