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
- [Docker를 사용한 실행](#docker를-사용한-실행)
- [CI/CD 파이프라인](#cicd-파이프라인)
- [배포](#배포)
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

### 인프라 및 배포
- **컨테이너화**: Docker + Docker Compose
- **CI/CD**: 
  - GitHub Actions (자동 빌드 및 Fly.io 배포) - **사용 중**
  - Jenkins (Docker 빌드 및 배포 파이프라인) - **참고용**
- **클라우드 배포**: Fly.io (백엔드/프론트엔드)
- **데이터베이스**: 
  - 개발: MySQL (Docker Compose)
  - 운영: MySQL (Aiven 또는 Fly.io 환경변수 설정)

---

## 📁 프로젝트 구조

```
culturemap/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions CI/CD 파이프라인
├── ci/
│   └── Jenkinsfile                 # Jenkins 파이프라인 설정
├── docker/
│   ├── Dockerfile                  # 백엔드 프로덕션 Dockerfile (Docker Compose용)
│   ├── Dockerfile.dev              # 백엔드 개발용 Dockerfile
│   ├── Dockerfile.fly              # 백엔드 Fly.io 배포용 Dockerfile
│   ├── docker-compose.yml          # 프로덕션 Docker Compose 설정
│   └── docker-compose.dev.yml      # 개발용 Docker Compose 설정
├── database/
│   └── init.sql                    # MySQL 초기화 스크립트
├── scripts/
│   └── git_push.bat                # Git 푸시 유틸리티 스크립트
├── src/main/java/com/culturemap/   # 백엔드 소스 코드
│   ├── config/                     # 설정 클래스 (Security, Swagger 등)
│   ├── controller/                 # REST API 컨트롤러
│   ├── domain/                     # JPA 엔티티 (Member, Plan, Place 등)
│   ├── dto/                        # 데이터 전송 객체
│   ├── exception/                  # 예외 처리
│   ├── repository/                 # JPA 리포지토리
│   ├── security/                   # JWT 인증 관련
│   └── service/                    # 비즈니스 로직
├── src/main/resources/
│   ├── static/                     # 정적 리소스 (이미지, CSS 등)
│   │   └── history_image/          # 히스토리 이미지 파일
│   ├── application.properties      # 기본 애플리케이션 설정
│   ├── application-dev.properties  # 개발 환경 설정
│   └── application-prod.properties # 프로덕션 환경 설정
├── fly.toml                        # Fly.io 백엔드 앱 설정
└── frontend/                       # React 프론트엔드
    ├── src/
    │   ├── components/             # React 컴포넌트
    │   ├── pages/                  # 페이지 컴포넌트
    │   ├── services/               # API 서비스
    │   ├── hooks/                  # 커스텀 훅
    │   ├── types/                  # TypeScript 타입 정의
    │   └── utils/                  # 유틸리티 함수
    ├── Dockerfile                  # 프론트엔드 프로덕션 Dockerfile
    ├── Dockerfile.dev              # 프론트엔드 개발용 Dockerfile
    ├── fly.toml                    # Fly.io 프론트엔드 앱 설정
    └── public/                     # 정적 파일
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

### 프로파일별 설정

프로젝트는 Spring Boot 프로파일을 사용하여 환경별 설정을 관리합니다:

- **개발 환경** (`dev`): `application-dev.properties`
  - 로컬 MySQL (포트 3308)
  - SQL 로그 출력
  - 개발용 기본값 사용

- **프로덕션 환경** (`prod`): `application-prod.properties`
  - 환경변수 기반 설정 (DB_URL, JWT_SECRET 등)
  - SQL 로그 비활성화
  - 운영 도메인 CORS 설정

### 백엔드 환경 변수

프로덕션 환경에서는 다음 환경 변수를 설정해야 합니다:

```bash
# 데이터베이스 (Aiven 또는 외부 MySQL)
DB_URL=jdbc:mysql://your-db-host:3306/culturemap?useSSL=false&serverTimezone=Asia/Seoul&characterEncoding=UTF-8&allowPublicKeyRetrieval=true
DB_USERNAME=your-username
DB_PASSWORD=your-password

# JWT 설정
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=86400000  # 24시간 (Access Token)
JWT_REFRESH_EXPIRATION=604800000  # 7일 (Refresh Token)

# CORS 설정
CORS_ALLOWED_ORIGINS=https://culturemap.fly.dev,https://culturemap-api.fly.dev

# Kakao API 키
KAKAO_REST_API_KEY=your-kakao-rest-api-key
```

### 프론트엔드 환경 변수

프론트엔드는 빌드 타임에 환경 변수를 주입합니다:

```bash
# .env.production 또는 빌드 시 --build-arg로 전달
VITE_API_BASE_URL=https://culturemap-api.fly.dev/api
VITE_KAKAO_MAP_API_KEY=your-kakao-javascript-key
```

### Kakao API 키 발급

1. [Kakao Developers](https://developers.kakao.com/)에 접속
2. 애플리케이션 생성
3. **REST API 키** 발급 (백엔드용)
4. **JavaScript 키** 발급 (프론트엔드용)
5. 환경 변수에 각각 설정

---

## 🐳 Docker를 사용한 실행

### 사전 요구사항

- Docker 및 Docker Compose 설치
- `.env` 파일 생성 (프로젝트 루트)

### Docker Compose로 전체 실행

#### 프로덕션 모드

```bash
# 프로젝트 루트에서
docker-compose -f docker/docker-compose.yml up -d --build
```

이 명령어는 다음을 실행합니다:
- MySQL 8.0 컨테이너 (포트 3306)
- 백엔드 Spring Boot 애플리케이션 (포트 8080)
- 프론트엔드 React 애플리케이션 (포트 5173)

#### 개발 모드 (Hot Reload)

```bash
# 개발 모드로 실행 (소스 코드 변경 시 자동 반영)
docker-compose -f docker/docker-compose.dev.yml up -d --build
```

### Docker Compose 명령어

```bash
# 서비스 중지 (컨테이너 유지)
docker-compose -f docker/docker-compose.yml stop

# 서비스 중지 및 컨테이너 제거 (볼륨 유지)
docker-compose -f docker/docker-compose.yml down

# 모든 것 제거 (볼륨 포함 - 데이터 삭제!)
docker-compose -f docker/docker-compose.yml down -v

# 로그 확인
docker-compose -f docker/docker-compose.yml logs -f

# 특정 서비스 로그
docker-compose -f docker/docker-compose.yml logs -f backend
docker-compose -f docker/docker-compose.yml logs -f frontend
docker-compose -f docker/docker-compose.yml logs -f mysql

# 컨테이너 상태 확인
docker-compose -f docker/docker-compose.yml ps
```

### 개별 Docker 이미지 빌드

#### 백엔드 이미지 빌드

```bash
# 프로덕션 이미지 (Docker Compose용)
docker build -t culturemap-backend -f docker/Dockerfile .

# 개발 이미지
docker build -t culturemap-backend-dev -f docker/Dockerfile.dev .

# Fly.io 배포용 이미지
docker build -t culturemap-backend-fly -f docker/Dockerfile.fly .
```

#### 프론트엔드 이미지 빌드

```bash
cd frontend

# 프로덕션 이미지 (환경 변수 포함)
docker build -t culturemap-frontend \
  --build-arg VITE_API_BASE_URL=https://culturemap-api.fly.dev/api \
  --build-arg VITE_KAKAO_MAP_API_KEY=your-key \
  -f Dockerfile .

# 개발 이미지
docker build -t culturemap-frontend-dev -f Dockerfile.dev .
```

---

## 🔄 CI/CD 파이프라인

### GitHub Actions

프로젝트는 GitHub Actions를 사용하여 자동 빌드 및 배포를 수행합니다.

#### 워크플로우 위치
- `.github/workflows/deploy.yml`

#### 주요 작업

1. **백엔드 빌드 & 테스트**
   - JDK 17 설정
   - Gradle 빌드 및 테스트 실행
   - 빌드 캐시 최적화

2. **프론트엔드 빌드 & 테스트**
   - Node.js 18 설정
   - 의존성 설치 및 린트 검사
   - 프로덕션 빌드

3. **Fly.io 배포**
   - 백엔드 배포 (`culturemap-api`)
   - 프론트엔드 배포 (`culturemap`)
   - `main` 브랜치 푸시 시에만 실행

#### 필요한 GitHub Secrets

- `FLY_API_TOKEN_BACKEND`: Fly.io 백엔드 앱 배포 토큰
- `FLY_API_TOKEN_FRONTEND`: Fly.io 프론트엔드 앱 배포 토큰
- `VITE_KAKAO_MAP_API_KEY`: 카카오 맵 JavaScript API 키

### Jenkins (참고용)

> **참고**: 현재 프로젝트는 GitHub Actions를 사용하고 있습니다. Jenkins는 로컬/내부 환경용 대안으로 제공됩니다.

Jenkins를 사용한 Docker 기반 빌드 및 배포 파이프라인도 지원합니다.

#### Jenkinsfile 위치
- `ci/Jenkinsfile`

#### 주요 단계

1. **코드 체크아웃**
2. **백엔드 빌드**: Gradle을 사용한 Spring Boot 빌드
3. **프론트엔드 빌드**: npm을 사용한 React 빌드
4. **Docker 이미지 빌드**: 백엔드 및 프론트엔드 이미지 생성
5. **Docker 이미지 푸시**: Docker Registry에 푸시 (설정된 경우)
6. **배포**: Docker Compose를 사용한 배포
7. **정리**: 오래된 이미지 제거

#### Jenkins 환경 변수

- `DOCKER_REGISTRY`: Docker Registry 주소 (선택사항)
- `VITE_API_BASE_URL`: 프론트엔드 API 기본 URL

---

## 🚀 배포

### Fly.io 배포

프로젝트는 Fly.io를 사용하여 클라우드에 배포됩니다.

#### 배포된 앱

- **백엔드**: `culturemap-api` (https://culturemap-api.fly.dev)
- **프론트엔드**: `culturemap` (https://culturemap.fly.dev)

#### Fly.io 설정 파일

- **백엔드**: `fly.toml` (프로젝트 루트)
- **프론트엔드**: `frontend/fly.toml`

#### 배포 방법

##### 수동 배포

```bash
# Fly.io CLI 설치 후
flyctl auth login

# 백엔드 배포
flyctl deploy --app culturemap-api

# 프론트엔드 배포
cd frontend
flyctl deploy --app culturemap \
  --build-arg VITE_API_BASE_URL=https://culturemap-api.fly.dev/api \
  --build-arg VITE_KAKAO_MAP_API_KEY=your-key
```

##### 자동 배포 (GitHub Actions)

`main` 브랜치에 푸시하면 자동으로 배포됩니다.

#### Fly.io 환경 변수 설정

```bash
# 백엔드 환경 변수
flyctl secrets set -a culturemap-api \
  DB_URL="jdbc:mysql://..." \
  DB_USERNAME="..." \
  DB_PASSWORD="..." \
  JWT_SECRET="..." \
  KAKAO_REST_API_KEY="..." \
  CORS_ALLOWED_ORIGINS="https://culturemap.fly.dev,https://culturemap-api.fly.dev"

# 프론트엔드 환경 변수 (빌드 시 주입)
# GitHub Secrets에 설정하거나 배포 시 --build-arg로 전달
```

### 데이터베이스 (Aiven)

프로덕션 환경에서는 Aiven 또는 다른 클라우드 MySQL 서비스를 사용할 수 있습니다.

#### Aiven 설정

1. Aiven에서 MySQL 서비스 생성
2. 연결 정보를 환경 변수로 설정:
   ```bash
   DB_URL=jdbc:mysql://[AIVEN_HOST]:[PORT]/culturemap?useSSL=true&serverTimezone=Asia/Seoul
   DB_USERNAME=[AIVEN_USERNAME]
   DB_PASSWORD=[AIVEN_PASSWORD]
   ```
3. Fly.io Secrets에 설정:
   ```bash
   flyctl secrets set -a culturemap-api \
     DB_URL="jdbc:mysql://..." \
     DB_USERNAME="..." \
     DB_PASSWORD="..."
   ```

#### 로컬 개발용 MySQL (Docker Compose)

로컬 개발 시에는 Docker Compose의 MySQL 컨테이너를 사용합니다:
- 포트: 3306 (프로덕션), 3309 (개발)
- 초기화 스크립트: `database/init.sql`

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

---

## 🔗 배포 링크

- **프로덕션 사이트**: https://culturemap.fly.dev
- **API 서버**: https://culturemap-api.fly.dev
- **API 문서 (Swagger)**: https://culturemap-api.fly.dev/swagger-ui.html

---

## 📚 추가 문서

- [배포 준비 상태 정리](./배포_준비_상태_정리.md): Docker 및 배포 관련 상세 정보
- [프론트엔드 README](./frontend/README.md): 프론트엔드 프로젝트 상세 정보
- [프론트엔드 환경 설정](./frontend/SETUP_ENV.md): 프론트엔드 환경 변수 설정 가이드
