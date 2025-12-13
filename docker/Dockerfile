# 백엔드 Dockerfile
FROM eclipse-temurin:17-jdk-alpine AS build

WORKDIR /app

# Gradle Wrapper 및 빌드 파일 복사
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .
COPY src src

# 실행 권한 부여
RUN chmod +x ./gradlew

# 애플리케이션 빌드
RUN ./gradlew clean build -x test --no-daemon

# 런타임 이미지
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# wget 설치 (헬스 체크용)
RUN apk add --no-cache wget

# 빌드된 JAR 파일 복사
COPY --from=build /app/build/libs/*.jar app.jar

# history_image 폴더 및 이미지 파일들 복사
COPY history_image /app/history_image

# 포트 노출
EXPOSE 8080

# 애플리케이션 실행
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]
