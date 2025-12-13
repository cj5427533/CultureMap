# --- build stage ---
    FROM eclipse-temurin:17-jdk AS build
    WORKDIR /app
    
    COPY gradlew .
    COPY gradle gradle
    COPY build.gradle settings.gradle ./
    COPY src src
    
    RUN chmod +x gradlew
    RUN ./gradlew clean bootJar --no-daemon
    
    # --- run stage ---
    FROM eclipse-temurin:17-jre
    WORKDIR /app
    
    COPY --from=build /app/build/libs/*.jar app.jar
    
    # history_image 폴더 및 이미지 파일들 복사
    COPY history_image /app/history_image
    
    # Fly에서 내부 포트를 8080으로 잡았으니 그대로 사용
    EXPOSE 8080
    
    # (선택) 자바 메모리 과다 사용 방지
    ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75.0"
    
    ENTRYPOINT ["java","-jar","/app/app.jar"]
    