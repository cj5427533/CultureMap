package com.culturemap.service;

import com.culturemap.domain.Place;
import com.culturemap.repository.PlaceRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.culturemap.config.KakaoApiCondition;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Conditional;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Conditional(KakaoApiCondition.class)
public class ExternalApiService {

    private final PlaceRepository placeRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // API 사용량 통계용 카운터
    private final java.util.concurrent.atomic.AtomicInteger totalSearchCalls = new java.util.concurrent.atomic.AtomicInteger(0);
    private final java.util.concurrent.atomic.AtomicInteger todaySearchCalls = new java.util.concurrent.atomic.AtomicInteger(0);
    private volatile java.time.LocalDate todayResetDate = java.time.LocalDate.now();

    @Value("${external.culture.api.key:}")
    private String cultureApiKey;

    @Value("${external.culture.api.url:https://www.culture.go.kr/openapi/rest/publicperformancedisplays}")
    private String cultureApiUrl;

    @Value("${kakao.rest-api-key:}")
    private String kakaoRestApiKey;

    /**
     * 한국문화정보원 문화시설 API에서 데이터를 가져와 Place 엔티티로 저장
     * 실제 API 연동 시 구현 필요
     */
    @Transactional
    public void syncPlacesFromExternalApi() {
        // TODO: 실제 API 연동 구현
        // 1. 한국문화정보원 API 호출
        // 2. 응답 데이터 파싱
        // 3. Place 엔티티로 변환하여 저장
        log.info("외부 API에서 문화시설 데이터 동기화 시작");
        
        // 예시: API 호출 및 파싱 로직
        // String url = cultureApiUrl + "?serviceKey=" + cultureApiKey + "&numOfRows=100";
        // String response = restTemplate.getForObject(url, String.class);
        // 파싱 후 placeRepository.save() 호출
    }

    /**
     * 수동으로 Place 추가 (테스트용)
     */
    @Transactional
    public Place addPlace(String name, String address, String category, 
                         BigDecimal latitude, BigDecimal longitude, String description) {
        Place place = Place.builder()
                .name(name)
                .address(address)
                .category(category)
                .latitude(latitude)
                .longitude(longitude)
                .description(description)
                .build();

        return placeRepository.save(place);
    }

    /**
     * Kakao Local API를 통해 주변 문화시설 검색 (단일 페이지)
     * @param lng 경도
     * @param lat 위도
     * @param radius 반경 (미터)
     * @param page 페이지 번호 (1부터 시작)
     * @return Kakao API 응답 JSON 문자열
     */
    private String searchNearbyCulturePlacesPage(double lng, double lat, int radius, int page) {
        // Kakao Local API - 카테고리 검색 (문화시설)
        // 카테고리 코드: CT1 (문화시설)
        String kakaoUrl = String.format(
            "https://dapi.kakao.com/v2/local/search/category.json?category_group_code=CT1&x=%.15f&y=%.15f&radius=%d&size=15&page=%d",
            lng, lat, radius, page
        );

        log.info("Kakao Local API 호출 (페이지 {}): {}", page, kakaoUrl);

        // HTTP 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "KakaoAK " + kakaoRestApiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        // HTTP 엔티티 생성
        HttpEntity<?> entity = new HttpEntity<>(headers);

        try {
            // RestTemplate을 사용하여 Kakao API 호출
            ResponseEntity<String> response = restTemplate.exchange(
                kakaoUrl,
                HttpMethod.GET,
                entity,
                String.class
            );

            log.info("Kakao Local API 응답 상태 (페이지 {}): {}", page, response.getStatusCode());
            return response.getBody();
        } catch (HttpClientErrorException e) {
            // 401 Unauthorized 에러 처리
            if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                String errorBody = e.getResponseBodyAsString();
                log.error("Kakao Local API 인증 실패 (페이지 {}): 상태 코드={}, 응답={}", 
                    page, e.getStatusCode(), errorBody);
                
                // IP 불일치 에러 메시지 확인
                if (errorBody != null && errorBody.contains("ip mismatched")) {
                    try {
                        JsonNode errorJson = objectMapper.readTree(errorBody);
                        String errorMessage = errorJson.has("message") 
                            ? errorJson.get("message").asText() 
                            : "IP 주소가 등록되지 않았습니다.";
                        
                        throw new RuntimeException(
                            "Kakao API IP 화이트리스트 오류: " + errorMessage + 
                            " Kakao Developers 콘솔에서 서버 IP 주소를 등록해주세요.", e);
                    } catch (Exception parseException) {
                        throw new RuntimeException(
                            "Kakao API 인증 실패: IP 주소가 등록되지 않았습니다. " +
                            "Kakao Developers 콘솔(https://developers.kakao.com)에서 " +
                            "애플리케이션 설정 > 플랫폼 > IP 주소에 서버 IP를 등록해주세요.", e);
                    }
                } else {
                    throw new RuntimeException(
                        "Kakao API 인증 실패: API 키를 확인해주세요. " +
                        "Kakao Developers 콘솔에서 REST API 키가 올바르게 설정되었는지 확인해주세요.", e);
                }
            }
            // 기타 HTTP 클라이언트 에러
            log.error("Kakao Local API 호출 실패 (페이지 {}): 상태 코드={}, 응답={}", 
                page, e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException(
                "주변 문화시설 검색에 실패했습니다: " + e.getStatusCode() + " " + 
                (e.getResponseBodyAsString() != null ? e.getResponseBodyAsString() : e.getMessage()), e);
        } catch (Exception e) {
            log.error("Kakao Local API 호출 실패 (페이지 {})", page, e);
            throw new RuntimeException("주변 문화시설 검색에 실패했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * Kakao Local API를 통해 주변 문화시설 검색 (여러 페이지 호출)
     * - 카테고리 검색 (CT1: 문화시설)
     * - 최대 3페이지까지 호출하여 결과 합침 (총 45개)
     * - IP 화이트리스트 및 API 키 검증 에러 처리
     * 
     * @param lng 경도
     * @param lat 위도
     * @param radius 반경 (미터, 기본 2000m)
     * @return Kakao API 응답 JSON 문자열 (여러 페이지 결과 합침)
     */
    public String searchNearbyCulturePlaces(double lng, double lat, int radius) {
        try {
            // 첫 페이지 호출하여 전체 개수 확인
            String firstPageResponse = searchNearbyCulturePlacesPage(lng, lat, radius, 1);
            JsonNode firstPageJson = objectMapper.readTree(firstPageResponse);
            
            JsonNode meta = firstPageJson.get("meta");
            int totalCount = meta.get("total_count").asInt();
            int pageableCount = meta.get("pageable_count").asInt();
            boolean isEnd = meta.get("is_end").asBoolean();
            
            log.info("전체 문화시설 개수: {}, 페이지 가능 개수: {}, 첫 페이지 종료 여부: {}", 
                totalCount, pageableCount, isEnd);
            
            // 첫 페이지 결과만 있으면 바로 반환
            if (isEnd || pageableCount <= 15) {
                return firstPageResponse;
            }
            
            // 여러 페이지 결과 합치기
            List<JsonNode> allDocuments = new ArrayList<>();
            JsonNode firstPageDocuments = firstPageJson.get("documents");
            if (firstPageDocuments != null && firstPageDocuments.isArray()) {
                firstPageDocuments.forEach(allDocuments::add);
            }
            
            // 최대 3페이지까지 호출 (총 45개)
            int maxPages = Math.min(3, (pageableCount + 14) / 15);
            for (int page = 2; page <= maxPages; page++) {
                String pageResponse = searchNearbyCulturePlacesPage(lng, lat, radius, page);
                JsonNode pageJson = objectMapper.readTree(pageResponse);
                JsonNode pageDocuments = pageJson.get("documents");
                
                if (pageDocuments != null && pageDocuments.isArray()) {
                    pageDocuments.forEach(allDocuments::add);
                }
                
                // 마지막 페이지면 중단
                JsonNode pageMeta = pageJson.get("meta");
                if (pageMeta != null && pageMeta.get("is_end").asBoolean()) {
                    break;
                }
            }
            
            log.info("총 {}개의 문화시설 검색 완료", allDocuments.size());
            
            // API 호출 카운터 증가
            totalSearchCalls.incrementAndGet();
            updateTodaySearchCounter();
            
            // 합친 결과를 JSON으로 재구성
            com.fasterxml.jackson.databind.node.ObjectNode resultJson = objectMapper.createObjectNode();
            com.fasterxml.jackson.databind.node.ObjectNode metaNode = objectMapper.createObjectNode();
            metaNode.put("total_count", totalCount);
            metaNode.put("pageable_count", pageableCount);
            metaNode.put("is_end", true);
            resultJson.set("meta", metaNode);
            resultJson.set("documents", objectMapper.valueToTree(allDocuments));
            
            return objectMapper.writeValueAsString(resultJson);
            
        } catch (Exception e) {
            log.error("주변 문화시설 검색 실패", e);
            throw new RuntimeException("주변 문화시설 검색에 실패했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * Kakao Local API를 통한 위치 기반 키워드 검색
     * @param query 검색 키워드
     * @param lng 경도
     * @param lat 위도
     * @param radius 반경 (미터, 기본 2000m)
     * @return Kakao API 응답 JSON 문자열
     */
    public String searchKeywordNearby(String query, double lng, double lat, int radius) {
        try {
            // 키워드 URL 인코딩
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
            
            // Kakao Local API - 키워드 검색
            String kakaoUrl = String.format(
                "https://dapi.kakao.com/v2/local/search/keyword.json?query=%s&x=%.15f&y=%.15f&radius=%d&size=15",
                encodedQuery, lng, lat, radius
            );

            log.info("Kakao Local API 키워드 검색 호출: {}", kakaoUrl);

            // HTTP 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "KakaoAK " + kakaoRestApiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            // HTTP 엔티티 생성
            HttpEntity<?> entity = new HttpEntity<>(headers);

            try {
                // RestTemplate을 사용하여 Kakao API 호출
                ResponseEntity<String> response = restTemplate.exchange(
                    kakaoUrl,
                    HttpMethod.GET,
                    entity,
                    String.class
                );

                log.info("Kakao Local API 키워드 검색 응답 상태: {}", response.getStatusCode());
                
                // API 호출 카운터 증가
                totalSearchCalls.incrementAndGet();
                updateTodaySearchCounter();
                
                return response.getBody();
            } catch (HttpClientErrorException e) {
                // 401 Unauthorized 에러 처리
                if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                    String errorBody = e.getResponseBodyAsString();
                    log.error("Kakao Local API 인증 실패: 상태 코드={}, 응답={}", 
                        e.getStatusCode(), errorBody);
                    
                    // IP 불일치 에러 메시지 확인
                    if (errorBody != null && errorBody.contains("ip mismatched")) {
                        try {
                            JsonNode errorJson = objectMapper.readTree(errorBody);
                            String errorMessage = errorJson.has("message") 
                                ? errorJson.get("message").asText() 
                                : "IP 주소가 등록되지 않았습니다.";
                            
                            throw new RuntimeException(
                                "Kakao API IP 화이트리스트 오류: " + errorMessage + 
                                " Kakao Developers 콘솔에서 서버 IP 주소를 등록해주세요.", e);
                        } catch (Exception parseException) {
                            throw new RuntimeException(
                                "Kakao API 인증 실패: IP 주소가 등록되지 않았습니다. " +
                                "Kakao Developers 콘솔(https://developers.kakao.com)에서 " +
                                "애플리케이션 설정 > 플랫폼 > IP 주소에 서버 IP를 등록해주세요.", e);
                        }
                    } else {
                        throw new RuntimeException(
                            "Kakao API 인증 실패: API 키를 확인해주세요. " +
                            "Kakao Developers 콘솔에서 REST API 키가 올바르게 설정되었는지 확인해주세요.", e);
                    }
                }
                // 기타 HTTP 클라이언트 에러
                log.error("Kakao Local API 키워드 검색 실패: 상태 코드={}, 응답={}", 
                    e.getStatusCode(), e.getResponseBodyAsString());
                throw new RuntimeException(
                    "키워드 검색에 실패했습니다: " + e.getStatusCode() + " " + 
                    (e.getResponseBodyAsString() != null ? e.getResponseBodyAsString() : e.getMessage()), e);
            } catch (Exception e) {
                log.error("Kakao Local API 키워드 검색 호출 실패", e);
                throw new RuntimeException("키워드 검색에 실패했습니다: " + e.getMessage(), e);
            }
        } catch (Exception e) {
            log.error("키워드 검색 실패", e);
            throw new RuntimeException("키워드 검색에 실패했습니다: " + e.getMessage(), e);
        }
    }
    
    private void updateTodaySearchCounter() {
        java.time.LocalDate today = java.time.LocalDate.now();
        if (!today.equals(todayResetDate)) {
            todayResetDate = today;
            todaySearchCalls.set(0);
        }
        todaySearchCalls.incrementAndGet();
    }
    
    public int getTodaySearchCalls() {
        updateTodaySearchCounter();
        return todaySearchCalls.get();
    }
    
    public int getTotalSearchCalls() {
        return totalSearchCalls.get();
    }
}

