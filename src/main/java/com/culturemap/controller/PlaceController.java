package com.culturemap.controller;

import com.culturemap.domain.Member;
import com.culturemap.dto.PlaceRequest;
import com.culturemap.dto.PlaceResponse;
import com.culturemap.repository.MemberRepository;
import com.culturemap.service.CacheService;
import com.culturemap.service.ExternalApiService;
import com.culturemap.service.PlaceService;
import com.culturemap.service.RateLimitService;
import com.culturemap.util.HttpUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/places")
@RequiredArgsConstructor
public class PlaceController {

    private final PlaceService placeService;
    private final ExternalApiService externalApiService;
    private final RateLimitService rateLimitService;
    private final CacheService cacheService;
    private final MemberRepository memberRepository;

    @GetMapping
    public ResponseEntity<List<PlaceResponse>> searchPlaces(
            @RequestParam(required = false) String keyword,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        List<PlaceResponse> responses = placeService.searchPlaces(keyword, userId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/popular")
    public ResponseEntity<List<PlaceResponse>> getPopularPlaces() {
        List<PlaceResponse> responses = placeService.getPopularPlaces();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/recent-searches")
    public ResponseEntity<List<String>> getRecentSearches(Authentication authentication) {
        Long userId = getUserId(authentication);
        if (userId == null) {
            return ResponseEntity.ok(List.of());
        }
        List<String> searches = cacheService.getRecentSearches(userId);
        return ResponseEntity.ok(searches);
    }

    @DeleteMapping("/recent-searches")
    public ResponseEntity<Void> clearRecentSearches(Authentication authentication) {
        Long userId = getUserId(authentication);
        if (userId != null) {
            cacheService.clearRecentSearches(userId);
        }
        return ResponseEntity.noContent().build();
    }

    private Long getUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        try {
            String email = ((UserDetails) authentication.getPrincipal()).getUsername();
            return memberRepository.findByEmail(email)
                    .map(Member::getId)
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlaceResponse> getPlace(@PathVariable Long id) {
        PlaceResponse response = placeService.getPlace(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 새로운 장소 생성 (카카오 API에서 가져온 장소를 DB에 저장)
     */
    @PostMapping
    public ResponseEntity<PlaceResponse> createPlace(@RequestBody PlaceRequest request) {
        PlaceResponse response = placeService.createPlace(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Kakao Local API를 통한 주변 문화시설 검색 (프록시)
     * @param lng 경도
     * @param lat 위도
     * @param radius 반경 (미터, 기본 2000m)
     * @return Kakao API 응답 JSON
     */
    @GetMapping("/kakao/nearby")
    public ResponseEntity<String> searchNearbyCulturePlaces(
            @RequestParam double lng,
            @RequestParam double lat,
            @RequestParam(defaultValue = "2000") int radius,
            HttpServletRequest httpRequest) {
        
        String clientIp = HttpUtil.getClientIpAddress(httpRequest);
        
        // 레이트 리밋 확인
        if (rateLimitService.isSearchExceeded(clientIp)) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "검색 API 호출 횟수를 초과했습니다. 1분 후 다시 시도해주세요.");
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(null);
        }
        
        String response = externalApiService.searchNearbyCulturePlaces(lng, lat, radius);
        return ResponseEntity.ok(response);
    }
}

