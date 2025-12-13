package com.culturemap.service;

import com.culturemap.domain.Place;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Kakao API 키가 없을 때 사용되는 대체 ExternalApiService 구현
 * 모든 메서드가 기능 비활성화 메시지를 반환합니다.
 */
@Service
@ConditionalOnMissingBean(ExternalApiService.class)
@Slf4j
public class DisabledExternalApiService {

    @Transactional
    public void syncPlacesFromExternalApi() {
        log.warn("ExternalApiService가 비활성화되어 있습니다. KAKAO_REST_API_KEY 환경변수를 설정해주세요.");
        throw new RuntimeException("외부 API 동기화 기능이 현재 사용할 수 없습니다. Kakao API 키가 설정되지 않았습니다.");
    }

    @Transactional
    public Place addPlace(String name, String address, String category, 
                         java.math.BigDecimal latitude, java.math.BigDecimal longitude, String description) {
        log.warn("ExternalApiService가 비활성화되어 있습니다. KAKAO_REST_API_KEY 환경변수를 설정해주세요.");
        throw new RuntimeException("장소 추가 기능이 현재 사용할 수 없습니다. Kakao API 키가 설정되지 않았습니다.");
    }

    public String searchNearbyCulturePlaces(double lng, double lat, int radius) {
        log.warn("ExternalApiService가 비활성화되어 있습니다. KAKAO_REST_API_KEY 환경변수를 설정해주세요.");
        throw new RuntimeException("주변 문화시설 검색 기능이 현재 사용할 수 없습니다. Kakao API 키가 설정되지 않았습니다.");
    }

    public String searchKeywordNearby(String query, double lng, double lat, int radius) {
        log.warn("ExternalApiService가 비활성화되어 있습니다. KAKAO_REST_API_KEY 환경변수를 설정해주세요.");
        throw new RuntimeException("키워드 검색 기능이 현재 사용할 수 없습니다. Kakao API 키가 설정되지 않았습니다.");
    }

    public int getTodaySearchCalls() {
        return 0;
    }

    public int getTotalSearchCalls() {
        return 0;
    }
}
