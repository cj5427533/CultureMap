package com.culturemap.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@Slf4j
public class CacheService {

    // 최근 검색 캐시: key = "userId:keyword", value = 검색 결과
    private final Map<String, CacheEntry<List<Map<String, Object>>>> searchCache = new ConcurrentHashMap<>();
    private static final Duration SEARCH_CACHE_TTL = Duration.ofMinutes(10);

    // 인기 장소 캐시: key = "popular", value = 인기 장소 리스트
    private final Map<String, CacheEntry<List<Map<String, Object>>>> popularPlacesCache = new ConcurrentHashMap<>();
    private static final Duration POPULAR_CACHE_TTL = Duration.ofHours(1);

    // 최근 검색 키워드: key = userId, value = 최근 검색 키워드 리스트 (최대 10개)
    private final Map<Long, LinkedList<String>> recentSearches = new ConcurrentHashMap<>();
    private static final int MAX_RECENT_SEARCHES = 10;

    private static class CacheEntry<T> {
        private final T data;
        private final Instant expiresAt;

        CacheEntry(T data, Duration ttl) {
            this.data = data;
            this.expiresAt = Instant.now().plus(ttl);
        }

        boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }

        T getData() {
            return data;
        }
    }

    /**
     * 검색 결과 캐시 저장
     */
    public void cacheSearchResult(Long userId, String keyword, List<Map<String, Object>> results) {
        if (userId == null || keyword == null || results == null) {
            return;
        }
        String key = userId + ":" + keyword.toLowerCase();
        searchCache.put(key, new CacheEntry<>(results, SEARCH_CACHE_TTL));
        log.debug("검색 결과 캐시 저장: key={}, count={}", key, results.size());
    }

    /**
     * 검색 결과 캐시 조회
     */
    public Optional<List<Map<String, Object>>> getCachedSearchResult(Long userId, String keyword) {
        if (userId == null || keyword == null) {
            return Optional.empty();
        }
        String key = userId + ":" + keyword.toLowerCase();
        CacheEntry<List<Map<String, Object>>> entry = searchCache.get(key);
        
        if (entry == null || entry.isExpired()) {
            if (entry != null) {
                searchCache.remove(key);
            }
            return Optional.empty();
        }
        
        log.debug("검색 결과 캐시 히트: key={}", key);
        return Optional.of(entry.getData());
    }

    /**
     * 인기 장소 캐시 저장
     */
    public void cachePopularPlaces(List<Map<String, Object>> places) {
        if (places == null) {
            return;
        }
        popularPlacesCache.put("popular", new CacheEntry<>(places, POPULAR_CACHE_TTL));
        log.debug("인기 장소 캐시 저장: count={}", places.size());
    }

    /**
     * 인기 장소 캐시 조회
     */
    public Optional<List<Map<String, Object>>> getCachedPopularPlaces() {
        CacheEntry<List<Map<String, Object>>> entry = popularPlacesCache.get("popular");
        
        if (entry == null || entry.isExpired()) {
            if (entry != null) {
                popularPlacesCache.remove("popular");
            }
            return Optional.empty();
        }
        
        log.debug("인기 장소 캐시 히트");
        return Optional.of(entry.getData());
    }

    /**
     * 최근 검색 키워드 추가
     */
    public void addRecentSearch(Long userId, String keyword) {
        if (userId == null || keyword == null || keyword.trim().isEmpty()) {
            return;
        }
        
        LinkedList<String> searches = recentSearches.computeIfAbsent(userId, k -> new LinkedList<>());
        String normalizedKeyword = keyword.trim().toLowerCase();
        
        // 중복 제거
        searches.remove(normalizedKeyword);
        searches.addFirst(normalizedKeyword);
        
        // 최대 개수 제한
        while (searches.size() > MAX_RECENT_SEARCHES) {
            searches.removeLast();
        }
        
        log.debug("최근 검색 추가: userId={}, keyword={}", userId, normalizedKeyword);
    }

    /**
     * 최근 검색 키워드 조회
     */
    public List<String> getRecentSearches(Long userId) {
        if (userId == null) {
            return Collections.emptyList();
        }
        LinkedList<String> searches = recentSearches.get(userId);
        return searches != null ? new ArrayList<>(searches) : Collections.emptyList();
    }

    /**
     * 최근 검색 키워드 삭제
     */
    public void clearRecentSearches(Long userId) {
        if (userId != null) {
            recentSearches.remove(userId);
            log.debug("최근 검색 삭제: userId={}", userId);
        }
    }

    /**
     * 만료된 캐시 정리
     */
    public void cleanupExpired() {
        searchCache.entrySet().removeIf(entry -> entry.getValue().isExpired());
        popularPlacesCache.entrySet().removeIf(entry -> entry.getValue().isExpired());
        log.debug("만료된 캐시 정리 완료");
    }
}
