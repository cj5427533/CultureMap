package com.culturemap.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@Slf4j
public class RateLimitService {

    // 로그인 시도 제한: IP 또는 이메일별로 5분에 5회
    private static final int LOGIN_ATTEMPT_LIMIT = 5;
    private static final long LOGIN_ATTEMPT_WINDOW_SECONDS = 300; // 5분

    // 검색 API 호출 제한: IP별로 1분에 30회
    private static final int SEARCH_LIMIT = 30;
    private static final long SEARCH_WINDOW_SECONDS = 60; // 1분

    // 로그인 시도 추적: key = "IP:email" 또는 "IP", value = AttemptInfo
    private final Map<String, AttemptInfo> loginAttempts = new ConcurrentHashMap<>();

    // 검색 API 호출 추적: key = IP, value = AttemptInfo
    private final Map<String, AttemptInfo> searchAttempts = new ConcurrentHashMap<>();

    private static class AttemptInfo {
        private final AtomicInteger count = new AtomicInteger(0);
        private volatile Instant resetAt;

        AttemptInfo(long windowSeconds) {
            this.resetAt = Instant.now().plusSeconds(windowSeconds);
        }

        boolean isExpired() {
            return Instant.now().isAfter(resetAt);
        }

        void reset(long windowSeconds) {
            count.set(0);
            resetAt = Instant.now().plusSeconds(windowSeconds);
        }

        int incrementAndGet() {
            if (isExpired()) {
                reset(LOGIN_ATTEMPT_WINDOW_SECONDS);
            }
            return count.incrementAndGet();
        }

        int getCount() {
            if (isExpired()) {
                return 0;
            }
            return count.get();
        }
    }

    /**
     * 로그인 시도 제한 확인
     * @param identifier IP 주소 또는 "IP:email" 형식
     * @return 제한 초과 시 true
     */
    public boolean isLoginAttemptExceeded(String identifier) {
        AttemptInfo info = loginAttempts.computeIfAbsent(
            identifier,
            k -> new AttemptInfo(LOGIN_ATTEMPT_WINDOW_SECONDS)
        );

        int count = info.incrementAndGet();
        
        if (count > LOGIN_ATTEMPT_LIMIT) {
            log.warn("로그인 시도 제한 초과: identifier={}, count={}", identifier, count);
            return true;
        }

        return false;
    }

    /**
     * 로그인 성공 시 시도 횟수 초기화
     */
    public void resetLoginAttempts(String identifier) {
        loginAttempts.remove(identifier);
        log.debug("로그인 시도 기록 초기화: identifier={}", identifier);
    }

    /**
     * 검색 API 호출 제한 확인
     * @param ip IP 주소
     * @return 제한 초과 시 true
     */
    public boolean isSearchExceeded(String ip) {
        AttemptInfo info = searchAttempts.computeIfAbsent(
            ip,
            k -> new AttemptInfo(SEARCH_WINDOW_SECONDS)
        );

        int count = info.incrementAndGet();
        
        if (count > SEARCH_LIMIT) {
            log.warn("검색 API 호출 제한 초과: ip={}, count={}", ip, count);
            return true;
        }

        return false;
    }

    /**
     * 만료된 기록 정리 (주기적으로 호출)
     */
    public void cleanupExpired() {
        loginAttempts.entrySet().removeIf(entry -> entry.getValue().isExpired());
        searchAttempts.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }
}
