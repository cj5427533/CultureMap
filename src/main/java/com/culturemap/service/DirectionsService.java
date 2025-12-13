package com.culturemap.service;

import com.culturemap.dto.DirectionsRequest;
import com.culturemap.dto.DirectionsResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import static org.springframework.http.HttpStatus.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class DirectionsService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${kakao.mobility.url:https://apis-navi.kakaomobility.com/v1/directions}")
    private String mobilityBaseUrl;

    @Value("${kakao.rest-api-key}")
    private String kakaoRestApiKey;

    private static final int PER_MINUTE_LIMIT = 60;
    private static final int DAILY_LIMIT = 400;
    private static final Duration CACHE_TTL = Duration.ofMinutes(10);

    private final AtomicInteger minuteCounter = new AtomicInteger(0);
    private volatile Instant minuteResetAt = Instant.now();

    private final AtomicInteger dailyCounter = new AtomicInteger(0);
    private volatile LocalDate dailyResetDate = LocalDate.now();
    
    // API 사용량 통계용 카운터
    private final AtomicInteger totalCalls = new AtomicInteger(0);
    private final AtomicInteger todayCalls = new AtomicInteger(0);
    private volatile LocalDate todayResetDate = LocalDate.now();

    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    public DirectionsResponse getCarDirections(DirectionsRequest request) {
        validateRequest(request);

        // 캐시 조회
        String cacheKey = buildCacheKey(request);
        DirectionsResponse cached = getFromCache(cacheKey);
        if (cached != null) {
            log.info("Directions cache hit for key={}", cacheKey);
            cached.setFromCache(true);
            return cached;
        }

        enforceLimits();

        String url = buildUrl(request);
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "KakaoAK " + kakaoRestApiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                DirectionsResponse parsed = parseResponse(response.getBody());
                parsed.setFromCache(false);
                parsed.setProvider("kakao-mobility");
                parsed.setTransportMode("CAR");
                putCache(cacheKey, parsed);
                
                // API 호출 카운터 증가
                totalCalls.incrementAndGet();
                updateTodayCounter();
                
                return parsed;
            }

            throw new ResponseStatusException(BAD_GATEWAY, "경로 요청에 실패했습니다.");
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.UNAUTHORIZED || e.getStatusCode() == HttpStatus.FORBIDDEN) {
                String body = e.getResponseBodyAsString();
                if (body != null && body.contains("ip mismatched")) {
                    throw new ResponseStatusException(FORBIDDEN, "Kakao API IP 화이트리스트에 서버 IP를 등록해주세요.");
                }
                throw new ResponseStatusException(UNAUTHORIZED, "Kakao API 키 또는 권한을 확인해주세요.");
            }
            if (e.getStatusCode() == TOO_MANY_REQUESTS) {
                throw new ResponseStatusException(TOO_MANY_REQUESTS, "Kakao API 레이트 리밋을 초과했습니다.");
            }
            log.error("Kakao Directions 호출 실패: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new ResponseStatusException(e.getStatusCode(), "경로 조회 실패: " + e.getStatusCode());
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Kakao Directions 호출 중 오류", ex);
            throw new ResponseStatusException(SERVICE_UNAVAILABLE, "경로 조회 중 오류가 발생했습니다.");
        }
    }

    private void validateRequest(DirectionsRequest request) {
        if (request.getOriginLat() == null || request.getOriginLng() == null ||
                request.getDestLat() == null || request.getDestLng() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "출발지와 도착지 좌표가 필요합니다.");
        }
        if (Objects.equals(request.getOriginLat(), request.getDestLat()) &&
                Objects.equals(request.getOriginLng(), request.getDestLng())) {
            throw new ResponseStatusException(BAD_REQUEST, "출발지와 도착지가 동일합니다.");
        }
    }

    private DirectionsResponse parseResponse(String body) throws Exception {
        JsonNode root = objectMapper.readTree(body);
        JsonNode routes = root.get("routes");
        if (routes == null || !routes.isArray() || routes.isEmpty()) {
            throw new ResponseStatusException(BAD_GATEWAY, "경로 결과가 비어있습니다.");
        }

        JsonNode firstRoute = routes.get(0);
        JsonNode summary = firstRoute.get("summary");
        double distance = summary != null && summary.has("distance") ? summary.get("distance").asDouble() : 0;
        double duration = summary != null && summary.has("duration") ? summary.get("duration").asDouble() : 0;

        List<DirectionsRequest.LatLng> path = extractPath(firstRoute);

        return DirectionsResponse.builder()
                .distanceMeters(distance)
                .durationSeconds(duration)
                .path(path)
                .build();
    }

    private List<DirectionsRequest.LatLng> extractPath(JsonNode routeNode) {
        JsonNode sections = routeNode.get("sections");
        if (sections == null || !sections.isArray()) {
            return Collections.emptyList();
        }

        List<DirectionsRequest.LatLng> coords = new ArrayList<>();
        sections.forEach(section -> {
            JsonNode roads = section.get("roads");
            if (roads == null || !roads.isArray()) {
                return;
            }
            roads.forEach(road -> {
                JsonNode vertexes = road.get("vertexes");
                if (vertexes == null || !vertexes.isArray()) {
                    return;
                }
                // vertexes: [lng1, lat1, lng2, lat2, ...]
                for (int i = 0; i < vertexes.size() - 1; i += 2) {
                    double lng = vertexes.get(i).asDouble();
                    double lat = vertexes.get(i + 1).asDouble();
                    coords.add(DirectionsRequest.LatLng.builder().lat(lat).lng(lng).build());
                }
            });
        });

        return coords;
    }

    private String buildUrl(DirectionsRequest request) {
        StringBuilder sb = new StringBuilder(mobilityBaseUrl);
        sb.append("?priority=RECOMMEND");
        sb.append("&car_fuel=GASOLINE");
        sb.append("&car_hipass=false");
        sb.append("&origin=").append(formatLngLat(request.getOriginLng(), request.getOriginLat()));
        sb.append("&destination=").append(formatLngLat(request.getDestLng(), request.getDestLat()));

        if (request.getWaypoints() != null && !request.getWaypoints().isEmpty()) {
            sb.append("&waypoints=");
            for (int i = 0; i < request.getWaypoints().size(); i++) {
                DirectionsRequest.LatLng wp = request.getWaypoints().get(i);
                if (wp.getLat() == null || wp.getLng() == null) {
                    continue;
                }
                sb.append(formatLngLat(wp.getLng(), wp.getLat()));
                if (i < request.getWaypoints().size() - 1) {
                    sb.append("|");
                }
            }
        }
        return sb.toString();
    }

    private String formatLngLat(Double lng, Double lat) {
        return String.format("%.6f,%.6f", lng, lat);
    }

    private void enforceLimits() {
        // 분 단위 리셋
        Instant now = Instant.now();
        if (now.isAfter(minuteResetAt.plusSeconds(60))) {
            minuteResetAt = now;
            minuteCounter.set(0);
        }
        if (minuteCounter.incrementAndGet() > PER_MINUTE_LIMIT) {
            throw new ResponseStatusException(TOO_MANY_REQUESTS, "분당 호출 한도를 초과했습니다.");
        }

        // 일일 리셋
        LocalDate today = LocalDate.now();
        if (!today.equals(dailyResetDate)) {
            dailyResetDate = today;
            dailyCounter.set(0);
        }
        if (dailyCounter.incrementAndGet() > DAILY_LIMIT) {
            throw new ResponseStatusException(TOO_MANY_REQUESTS, "일일 호출 한도를 초과했습니다.");
        }
    }

    private DirectionsResponse getFromCache(String key) {
        CacheEntry entry = cache.get(key);
        if (entry == null) return null;
        if (Instant.now().isAfter(entry.expiresAt())) {
            cache.remove(key);
            return null;
        }
        return entry.response;
    }

    private void putCache(String key, DirectionsResponse response) {
        cache.put(key, new CacheEntry(response, Instant.now().plus(CACHE_TTL)));
    }

    private String buildCacheKey(DirectionsRequest request) {
        StringBuilder key = new StringBuilder();
        key.append(formatLngLat(request.getOriginLng(), request.getOriginLat()))
                .append("->")
                .append(formatLngLat(request.getDestLng(), request.getDestLat()));
        if (request.getWaypoints() != null && !request.getWaypoints().isEmpty()) {
            key.append("|wp=");
            request.getWaypoints().forEach(wp -> key.append(formatLngLat(wp.getLng(), wp.getLat())).append(";"));
        }
        return key.toString();
    }

    private void updateTodayCounter() {
        LocalDate today = LocalDate.now();
        if (!today.equals(todayResetDate)) {
            todayResetDate = today;
            todayCalls.set(0);
        }
        todayCalls.incrementAndGet();
    }

    public int getTodayCalls() {
        updateTodayCounter();
        return todayCalls.get();
    }

    public int getTotalCalls() {
        return totalCalls.get();
    }

    private record CacheEntry(DirectionsResponse response, Instant expiresAt) { }
}
