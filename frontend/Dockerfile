# 프론트엔드 Dockerfile
# 빌드 단계
FROM node:18-alpine AS build

WORKDIR /app

# 빌드 시 환경변수를 ARG로 받음
ARG VITE_KAKAO_MAP_API_KEY
ARG VITE_API_BASE_URL=https://culturemap-api.fly.dev/api

# 환경변수를 빌드 타임에 사용할 수 있도록 ENV로 설정
ENV VITE_KAKAO_MAP_API_KEY=$VITE_KAKAO_MAP_API_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# package.json 복사 및 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스 코드 복사 (.env.production 포함, 있으면)
COPY . .

# .env 파일이 있으면 제거 (충돌 방지)
# .env.production이 우선순위를 가지도록 함
RUN if [ -f .env ]; then \
      echo "WARNING: .env file found, checking for conflicts..."; \
      if grep -q "VITE_KAKAO_MAP_API_KEY" .env; then \
        echo "WARNING: VITE_KAKAO_MAP_API_KEY found in .env, removing to avoid conflict"; \
        grep -v "VITE_KAKAO_MAP_API_KEY" .env > .env.tmp && mv .env.tmp .env || true; \
      fi; \
      if grep -q "VITE_API_BASE_URL" .env; then \
        echo "WARNING: VITE_API_BASE_URL found in .env, removing to avoid conflict"; \
        grep -v "VITE_API_BASE_URL" .env > .env.tmp && mv .env.tmp .env || true; \
      fi; \
    fi

# .env.production 파일 확인 및 생성 (BOM 제거 포함)
RUN echo "Checking for .env.production file..." && \
    ls -la .env* 2>/dev/null || echo "No .env files found" && \
    if [ -f .env.production ]; then \
      echo "Found existing .env.production file"; \
      echo "Removing UTF-8 BOM if present..."; \
      sed -i '1s/^\xEF\xBB\xBF//' .env.production 2>/dev/null || true; \
      echo "File contents:"; \
      cat .env.production; \
      echo ""; \
      echo "API Key extraction and validation:"; \
      API_KEY=$(grep -E "^VITE_KAKAO_MAP_API_KEY=" .env.production | sed 's/^VITE_KAKAO_MAP_API_KEY=//' | tr -d ' \r\n'); \
      if [ -z "$API_KEY" ]; then \
        echo "ERROR: Could not extract API key from .env.production"; \
        echo "Trying alternative extraction method..."; \
        API_KEY=$(cat .env.production | grep VITE_KAKAO_MAP_API_KEY | head -1 | sed 's/.*VITE_KAKAO_MAP_API_KEY=//' | tr -d ' \r\n'); \
        if [ -z "$API_KEY" ]; then \
          echo "ERROR: Still could not extract API key"; \
          echo "File content (hex dump):"; \
          hexdump -C .env.production | head -20; \
          exit 1; \
        fi; \
      fi; \
      echo "Extracted API Key length: ${#API_KEY}"; \
      echo "First 10 chars: ${API_KEY:0:10}..."; \
      if [ ${#API_KEY} -lt 30 ]; then \
        echo "ERROR: API Key is too short (${#API_KEY} chars). Minimum 30 required."; \
        echo "Current key: $API_KEY"; \
        exit 1; \
      else \
        echo "API Key length is valid"; \
      fi; \
      echo "Recreating .env.production without BOM..."; \
      echo "VITE_KAKAO_MAP_API_KEY=${API_KEY}" > .env.production && \
      echo "VITE_API_BASE_URL=${VITE_API_BASE_URL}" >> .env.production && \
      echo "Verifying recreated file:"; \
      cat .env.production; \
    else \
      echo ".env.production not found, creating from build args..."; \
      if [ -z "$VITE_KAKAO_MAP_API_KEY" ] || [ "$VITE_KAKAO_MAP_API_KEY" = "" ]; then \
        echo "ERROR: VITE_KAKAO_MAP_API_KEY is not set!"; \
        echo "Please either:"; \
        echo "  1. Create .env.production file with VITE_KAKAO_MAP_API_KEY=your_key"; \
        echo "  2. Use: fly deploy --build-arg VITE_KAKAO_MAP_API_KEY=your_key"; \
        exit 1; \
      else \
        echo "Build arg API Key length: ${#VITE_KAKAO_MAP_API_KEY}"; \
        if [ ${#VITE_KAKAO_MAP_API_KEY} -lt 30 ]; then \
          echo "ERROR: Build arg API Key is too short (${#VITE_KAKAO_MAP_API_KEY} chars)"; \
          exit 1; \
        fi; \
      fi; \
      echo "VITE_KAKAO_MAP_API_KEY=${VITE_KAKAO_MAP_API_KEY}" > .env.production && \
      echo "VITE_API_BASE_URL=${VITE_API_BASE_URL}" >> .env.production && \
      echo "Created .env.production:"; \
      cat .env.production; \
    fi && \
    echo "" && \
    echo "Final .env.production verification:" && \
    cat .env.production && \
    echo "" && \
    echo "Final API Key validation:" && \
    FINAL_KEY=$(grep -E "^VITE_KAKAO_MAP_API_KEY=" .env.production | sed 's/^VITE_KAKAO_MAP_API_KEY=//' | tr -d ' \r\n'); \
    echo "Length: ${#FINAL_KEY} characters" && \
    echo "First 10 chars: ${FINAL_KEY:0:10}..." && \
    if [ ${#FINAL_KEY} -lt 30 ]; then \
      echo "ERROR: Final API Key validation failed!"; \
      exit 1; \
    else \
      echo "Final API Key validation passed"; \
    fi

# 애플리케이션 빌드
RUN echo "🚀 Starting build..." && \
    npm run build && \
    echo "✅ Build completed" && \
    echo "🔍 Verifying built files..." && \
    if [ -f dist/index.html ]; then \
      echo "✅ dist/index.html exists"; \
      if grep -q "VITE_KAKAO_MAP_API_KEY" dist/assets/*.js 2>/dev/null; then \
        echo "✅ API key found in built files"; \
      else \
        echo "⚠️ WARNING: API key not found in built files"; \
      fi; \
    fi


# 프로덕션 단계
FROM nginx:alpine

# 빌드된 파일을 nginx로 복사
COPY --from=build /app/dist /usr/share/nginx/html

# nginx 설정 파일 복사 (선택사항)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 포트 노출
EXPOSE 80

# nginx 실행
CMD ["nginx", "-g", "daemon off;"]
